import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configuration
const REASONING_MODEL = "deepseek-reasoner";
const SUMMARIZER_MODEL = "gpt-4o-mini";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

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
      functions: functions,
      function_call: "auto",
    });

    const responseMessage = openaiResponse.choices[0].message;

    if (responseMessage.tool_calls) {
      console.log("Function call detected:", responseMessage.tool_calls);

      // Parse the function call
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      if (toolCall.function.name === "performWebSearch") {
        const result = await performWebSearch(args.query);

        // Return result to the user
        console.log(`Web Search Results for "${args.query}":`, result);

        // Return the results
        return NextResponse.json({
          question,
          reasoning,
          summary: result,
        });
      }
    } else {
       // Return the results
    return NextResponse.json({
      question,
      reasoning,
      summary: responseMessage.content,
    });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing the request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update the function to perform web search
async function performWebSearch(query: string) {
  const url = 'https://api.tavily.com/search';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': TAVILY_API_KEY!
      },
      body: JSON.stringify({
        query: query,
        search_depth: "advanced",
        include_images: false,
        include_answer: true,
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.answer,
      results: data.results.slice(0, 5).map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content
      }))
    };
  } catch (error) {
    console.error('Error performing web search:', error);
    return null;
  }
}

// Define function schema for OpenAI tool calling
const functions = [
  {
    name: "performWebSearch",
    description: "Search the web for current information on a given topic or query.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find information about.",
        }
      },
      required: ["query"],
    },
  }
];