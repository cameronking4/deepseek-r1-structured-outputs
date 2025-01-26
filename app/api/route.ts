import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configuration
const REASONING_MODEL = "deepseek-reasoner";
const SUMMARIZER_MODEL = "gpt-3.5-turbo";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const DEEPSEEK_API_URL = "https://api.deepseek.com";
// const OPEN_ROUTER_API_URL = "https://openrouter.ai/api/v1";

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Initialize OpenAI clients
    const deepseek = new OpenAI({
      baseURL: DEEPSEEK_API_URL, // Or use OPEN_ROUTER_API_URL
      apiKey: DEEPSEEK_API_KEY,
    });

    // Reasoning Phase
    const deepseekResponse = await deepseek.chat.completions.create({
      model: REASONING_MODEL,
      messages: [{ role: "user", content: question }],
      stream: false,
      stop: "</think>"
    });

    const reasoning = deepseekResponse.choices[0]?.message.content ?? '';
    const reasoningTokens = deepseekResponse.usage?.total_tokens ?? 0;

    // Summarization Phase
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

    const openaiResponse = await openai.chat.completions.create({
      model: SUMMARIZER_MODEL,
      messages: [
        {
          role: "system",
          content: "Answer the initial <QUESTION> in a single sentence based on the <REASONING>",
        },
        {
          role: "user",
          content: `
            <QUESTION>
            ${question}
            </QUESTION>
            <REASONING>
            ${reasoning}
            </REASONING>
            `,
        },
      ],
    });

    const summary = openaiResponse.choices[0]?.message.content ?? '';
    const summaryTokens = openaiResponse.usage?.total_tokens ?? 0;

    // Return the results
    return NextResponse.json({
      question,
      reasoning,
      summary,
      usage: {
        reasoning_tokens: reasoningTokens,
        summary_tokens: summaryTokens,
        total_tokens: reasoningTokens + summaryTokens
      }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing the request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}