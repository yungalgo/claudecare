import type { ServerWebSocket } from "bun";
import { createSession, getSession, deleteSession, saveTranscript, getGreeting, processUtterance, fetchMemoryContext } from "./protocol.ts";
import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import { CALL_TYPES, type CallType } from "../lib/constants.ts";

// Twilio ConversationRelay WebSocket protocol
// Messages from Twilio:
//   { type: "setup", callSid: "...", ... }
//   { type: "prompt", voicePrompt: "..." }     (speech-to-text result)
//   { type: "interrupt" }
//   { type: "dtmf", digit: "..." }
// Messages to Twilio:
//   { type: "text", token: "..." }              (text-to-speech)
//   { type: "end" }                             (hang up)

interface WsData {
  personId: string;
  callId: string;
}

// Track ws → callSid for cleanup
const wsCallSidMap = new WeakMap<ServerWebSocket<WsData>, string>();

export const handleWebSocket = {
  async open(ws: ServerWebSocket<WsData>) {
    console.log(`[ws] ConversationRelay connection opened (person=${ws.data.personId}, call=${ws.data.callId})`);
  },

  async message(ws: ServerWebSocket<WsData>, msg: string | Buffer) {
    try {
      const data = JSON.parse(typeof msg === "string" ? msg : msg.toString());

      switch (data.type) {
        case "setup": {
          const callSid = data.callSid ?? "";
          const { personId, callId } = ws.data;
          console.log(`[ws] Setup: callSid=${callSid}, personId=${personId}, callId=${callId}`);

          // Track callSid for cleanup on close
          wsCallSidMap.set(ws, callSid);

          // Look up person name and call type in parallel
          const [personResult, callResult, memoryContext] = await Promise.all([
            personId
              ? db.select({ name: schema.persons.name, agentName: schema.persons.agentName }).from(schema.persons).where(eq(schema.persons.id, personId))
              : Promise.resolve([]),
            callId
              ? db.select({ callType: schema.calls.callType }).from(schema.calls).where(eq(schema.calls.id, callId))
              : Promise.resolve([]),
            personId
              ? fetchMemoryContext(personId)
              : Promise.resolve(""),
          ]);

          const personName = personResult[0]?.name ?? "there";
          const agentName = personResult[0]?.agentName ?? "Sarah";
          const callType = (callResult[0]?.callType as CallType) ?? CALL_TYPES.STANDARD;

          // Update call record with Twilio SID if we have one
          if (callSid && callId) {
            await db
              .update(schema.calls)
              .set({ callSid, startedAt: new Date() })
              .where(eq(schema.calls.id, callId));
          }

          const session = createSession(callSid, personId, callId, personName, agentName, callType, memoryContext);
          const t0 = performance.now();
          const greeting = await getGreeting(session);
          const greetLatency = Math.round(performance.now() - t0);

          console.log(`[ws] Bot (${greetLatency}ms, type=${callType}): "${greeting.substring(0, 80)}..."`);
          ws.send(JSON.stringify({ type: "text", token: greeting }));
          break;
        }

        case "prompt": {
          const t0 = performance.now();
          const utterance = data.voicePrompt ?? "";
          console.log(`[ws] Caller: "${utterance}"`);

          const callSid = wsCallSidMap.get(ws) ?? data.callSid ?? "";
          const session = getSession(callSid);
          if (!session) {
            console.warn("[ws] No session for callSid:", callSid);
            break;
          }

          const { text: response, endCall } = await processUtterance(session, utterance);
          const latencyMs = Math.round(performance.now() - t0);
          if (response) {
            console.log(`[ws] Bot (${latencyMs}ms, phase=${session.currentPhase}): "${response.substring(0, 80)}..."`);
            ws.send(JSON.stringify({ type: "text", token: response }));
          }
          if (endCall) {
            // Give TTS time to finish the closing message, then hang up
            setTimeout(() => {
              console.log("[ws] Ending call after assessment submission");
              ws.send(JSON.stringify({ type: "end" }));
            }, 8000);
          }
          break;
        }

        case "interrupt": {
          // Don't log every interrupt — they're noisy
          break;
        }

        case "dtmf": {
          console.log(`[ws] DTMF: ${data.digit}`);
          break;
        }

        default: {
          console.log(`[ws] Unknown message type: ${data.type}`);
        }
      }
    } catch (err) {
      console.error("[ws] Error:", err);
      ws.send(JSON.stringify({ type: "text", token: "I'm sorry, I'm having a technical difficulty. Let me try again." }));
    }
  },

  async close(ws: ServerWebSocket<WsData>) {
    const callSid = wsCallSidMap.get(ws);
    console.log(`[ws] ConversationRelay connection closed (callSid=${callSid})`);
    if (callSid) {
      // Save transcript before deleting session (even for incomplete calls)
      await saveTranscript(callSid).catch((err) =>
        console.error(`[ws] Failed to save transcript:`, err),
      );
      deleteSession(callSid);
    }
  },
};
