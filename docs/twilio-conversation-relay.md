# TwiML Voice: ConversationRelay

## Overview
The `<ConversationRelay>` TwiML noun enables AI-powered voice interactions by routing calls to a WebSocket server. It handles STT/TTS conversions and real-time session management.

## Essential Attributes

| Attribute | Purpose | Default |
|-----------|---------|---------|
| **url** | WebSocket server endpoint (wss:// required) | Required |
| **welcomeGreeting** | Message played after call answer | Optional |
| **language** | Sets both STT and TTS language | en-US |
| **ttsProvider** | Google, Amazon, ElevenLabs | ElevenLabs |
| **transcriptionProvider** | Google, Deepgram | Deepgram |
| **interruptible** | Caller speech can interrupt TTS | any |
| **voice** | TTS voice to use | Provider default |
| **dtmfDetection** | Detect DTMF tones | false |

## WebSocket Protocol

### Messages FROM Twilio to your server:
- `{ type: "setup", callSid: "...", customParameters: {...} }` — Initial setup on connect
- `{ type: "prompt", voicePrompt: "..." }` — Speech-to-text result from caller
- `{ type: "interrupt" }` — Caller interrupted TTS playback
- `{ type: "dtmf", digit: "5" }` — DTMF tone detected

### Messages TO Twilio from your server:
- `{ type: "text", token: "Hello there" }` — Text to speak via TTS
- `{ type: "end" }` — End the call

## TwiML Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://example.com/ws" voice="Google.en-US-Journey-F" dtmfDetection="true" interruptible="true">
      <Parameter name="personId" value="123" />
    </ConversationRelay>
  </Connect>
</Response>
```

## References
- https://www.twilio.com/docs/voice/twiml/connect/conversationrelay
