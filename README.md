# DeepSeek Reasoning + OpenAI summarization

As of 1/26/2025, DeepSeek's R1 model does not support structured outputs and tool calling.. This project is a proof of concept for how to use DeepSeek's reasoning model to analyze questions in detail and then use GPT's summarization power to create a structured output and make tool calls while keeping the cost down.

## Project Description

A Next.js application that combines DeepSeek's reasoning capabilities with GPT's summarization power. This project demonstrates how to:
1. Use DeepSeek's reasoning stage and handoff to OpenAI
2. Process responses in multiple formats (basic, structured, tool-calling)
3. Swap GPT models on the client to experiement with summarization and cost

## Features

- Modern Next.js web interface with real-time interactions
- Multiple API endpoints for different response formats
- Dark/light theme support with Tailwind CSS
- Real-time response streaming
- Structured data outputs with JSON schema validation
- Cost-effective hybrid model approach
- Chat UI made using shadcn/ui

## Development

```
pnpm install 
touch .env
pnpm dev
```

Environment variables:

```
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
```

## API Routes

### Basic API (`/api/route.ts`)
- Simple question/answer format
- Uses DeepSeek for reasoning and GPT-3.5-turbo for summarization
- Returns plain text responses with token usage metrics

### Structured API (`/api/structured/route.ts`)
- Enhanced response format with JSON schema validation
- Structured output includes:
  - One-sentence summary
  - Bullet points
  - Reasoning steps count
  - Follow-up prompts
- Uses GPT-4o-mini for structured summarization

### Tool Calling API (`/api/tool-calling/route.ts`)
- Advanced response format with function calling capabilities
- Similar structure to structured API
- Optimized for integration with external tools and services

## Requirements

You'll need API keys for:
- DeepSeek API (for reasoning capabilities)
- OpenAI API (for summarization)


## How It Works

1. User submits a question through the web interface or API
2. The selected API route processes the request:
   - DeepSeek model provides detailed reasoning
   - GPT model creates summary after thinking phase and returns API response
3. Usage metrics and timing are tracked and returned as well

## Implementation Details

The code demonstrates several key patterns:
- Next.js App Router architecture
- React Server Components with client-side interactivity
- Tailwind CSS for styling with CSS variables
- Radix UI primitives for accessible components
- TypeScript for type safety
- Real-time response streaming
- Error handling and loading states
