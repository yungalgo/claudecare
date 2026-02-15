# Anthropic Messages API Documentation

## Core Endpoints

**Create Message** (`POST /v1/messages`): Send input messages for Claude to generate responses.
**Count Tokens** (`POST /v1/messages/count_tokens`): Determine token usage without creating a message.

## Essential Parameters

- **max_tokens** (required): Ceiling for generated tokens
- **messages** (required): Array of conversational turns (user/assistant roles). Up to 100,000 messages.
- **model** (required): Which Claude model to use

## Content Types Supported
- Text with optional citations
- Images (JPEG, PNG, GIF, WebP) via base64 or URL
- PDFs and plain text documents
- Tool use blocks for function calling
- Extended thinking blocks

## Tool Use

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  system: "You are a helpful assistant.",
  messages: [{ role: "user", content: "Hello" }],
  tools: [{
    name: "my_tool",
    description: "Description of the tool",
    input_schema: {
      type: "object",
      properties: {
        param: { type: "string", description: "A parameter" }
      },
      required: ["param"]
    }
  }]
});
```

## Streaming

```typescript
const stream = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

## References
- https://docs.anthropic.com/en/api/messages
- https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- https://github.com/anthropics/anthropic-sdk-typescript
