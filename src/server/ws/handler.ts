import type { ServerWebSocket } from "bun";
import { createSession, getSession, deleteSession, getGreeting, processUtterance } from "./protocol.ts";
import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";

// Twilio ConversationRelay WebSocket protocol
// Messages from Twilio:
//   { type: "setup", callSid: "...", ... }
//   { type: "prompt", voicePrompt: "..." }     (speech-to-text result)
//   { type: "interrupt" }
//   { type: "dtmf", digit: "..." }
// Messages to Twilio:
//   { type: "text", token: "..." }              (text-to-speech)
//   { type: "end" }                             (hang up)

export const handleWebSocket = {
  async open(ws: ServerWebSocket<unknown>) {
    console.log("[ws] ConversationRelay connection opened");
  },

  async message(ws: ServerWebSocket<unknown>, msg: string | Buffer) {
    try {
      const data = JSON.parse(typeof msg === "string" ? msg : msg.toString());

      switch (data.type) {
        case "setup": {
          // Extract params from the URL used to connect
          const callSid = data.callSid ?? "";
          console.log(`[ws] Setup: callSid=${callSid}`);

          // Look up the call to get personId
          const url = new URL(`http://localhost${ws.data ? "" : ""}` ); // ws.data not used for now
          // The personId was passed in the ConversationRelay URL params
          // We'll extract from the setup event's customParameters or find via callSid
          let personId = data.customParameters?.personId ?? "";
          let personName = "there";

          if (!personId && callSid) {
            // Try to find by callSid
            const [call] = await db.select().from(schema.calls).where(eq(schema.calls.callSid, callSid));
            if (call) {
              personId = call.personId;
              const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, personId));
              if (person) personName = person.name;
            }
          } else if (personId) {
            const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, personId));
            if (person) personName = person.name;
          }

          // Find or create call record
          let callId = "";
          if (callSid) {
            const [call] = await db.select().from(schema.calls).where(eq(schema.calls.callSid, callSid));
            if (call) callId = call.id;
          }

          if (!callId && personId) {
            const [newCall] = await db.insert(schema.calls).values({
              personId,
              callSid,
              callType: "weekly",
              status: "in-progress",
              startedAt: new Date(),
            }).returning();
            callId = newCall!.id;
          }

          const session = createSession(callSid, personId, callId, personName);
          const greeting = await getGreeting(session);

          ws.send(JSON.stringify({ type: "text", token: greeting }));
          break;
        }

        case "prompt": {
          // Speech-to-text result from caller
          const utterance = data.voicePrompt ?? "";
          console.log(`[ws] Caller said: "${utterance}"`);

          const callSid = data.callSid ?? "";
          const session = getSession(callSid);
          if (!session) {
            console.warn("[ws] No session for callSid:", callSid);
            break;
          }

          const response = await processUtterance(session, utterance);
          if (response) {
            ws.send(JSON.stringify({ type: "text", token: response }));
          }
          break;
        }

        case "interrupt": {
          console.log("[ws] Caller interrupted");
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
    }
  },

  close(ws: ServerWebSocket<unknown>) {
    console.log("[ws] ConversationRelay connection closed");
    // Clean up sessions (we'd need to track which ws maps to which callSid)
  },
};
