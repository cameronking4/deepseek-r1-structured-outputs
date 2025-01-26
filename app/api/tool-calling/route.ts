import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configuration
const REASONING_MODEL = "deepseek-reasoner";
const SUMMARIZER_MODEL = "gpt-4o-mini";

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

    // Summarization Phase
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const jsonSchema = {
      type: "object",
      properties: {
        summary: { type: "string", description: "A one-sentence summary of the answer." },
        bullet_points: {
          type: "array",
          items: { type: "string" },
          description: "Key points related to the answer.",
        },
        reasoning_steps: {
          type: "number",
          description: "The length of the reasoning / steps in the chain of thought provided.",
        },
        follow_up_prompts: {
          type: "array",
          items: { type: "string" },
          description: "Suggested prompts for follow-up conversations.",
        },
      },
      required: ["summary", "bullet_points", "reasoning_length", "follow_up_prompts"],
      additionalProperties: false,
    };

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
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          schema: jsonSchema,
          strict: true,
        },
      },
    });

    const summary = JSON.stringify(openaiResponse.choices[0]?.message.content, null, 2) ?? '';

    // Return the results
    return NextResponse.json({
      question,
      reasoning,
      summary,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing the request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}