'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  Send, 
  ChevronRight,
  Brain, 
  Clock,
  Settings,
  MessageSquare,
  Coins
} from "lucide-react"

type Message = {
  role: 'user' | 'assistant'
  content: string
  timing?: number
  usage?: {
    reasoning_tokens: number
    summary_tokens: number
    total_tokens: number
  }
}

type ApiRoute = 'basic' | 'structured' | 'tool-calling'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiRoute, setApiRoute] = useState<ApiRoute>('structured')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const startTime = Date.now()
    setIsLoading(true)
    
    // Add timer update interval
    const timerInterval = setInterval(() => {
      setLoadingTime(Date.now() - startTime)
    }, 100)
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }])
    
    try {
      const response = await fetch(
        apiRoute === 'structured' 
          ? '/api/structured' 
          : apiRoute === 'tool-calling'
            ? '/api/tool-calling'
            : '/api', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: input }),
        }
      )

      const data = await response.json()
      const timing = Date.now() - startTime

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Reasoning: ${data.reasoning}\n\nSummary: ${data.summary}`,
        timing,
        usage: data.usage
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }])
    } finally {
      setIsLoading(false)
      setInput('')
      clearInterval(timerInterval)  // Clean up timer
      setLoadingTime(0)  // Reset timer
    }
  }

  return (
    <div className="min-h-screen p-4 flex flex-col max-w-3xl mx-auto">
      <header className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">DeepSeek Reasoning Chat</h1>
        </div>
        <Select value={apiRoute} onValueChange={(value) => setApiRoute(value as ApiRoute)}>
          <SelectTrigger className="w-[180px]">
            <Settings className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select API" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="structured">Structured API</SelectItem>
            <SelectItem value="basic">Basic API</SelectItem>
            <SelectItem value="tool-calling">Tool Calling API</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, i) => (
          <Card
            key={i}
            className={`${
              message.role === 'user' 
                ? 'ml-8 bg-primary/10' 
                : 'mr-8 bg-muted'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'user' ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span className="text-sm text-muted-foreground">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              {message.role === 'assistant' ? (
                <>
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
                      <ChevronRight className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                      Show Reasoning
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 pl-4 border-l-2 border-muted">
                      {message.content.split('\n\nSummary:')[0].replace('Reasoning:', '').trim()}
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="font-medium mt-2">
                    Summary: {message.content.split('\n\nSummary:')[1]?.trim()}
                  </div>
                </>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
              {(message.timing || message.usage) && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-3">
                  {message.timing && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {message.timing}ms
                    </div>
                  )}
                  {message.usage && (
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {message.usage.total_tokens} tokens
                      <span className="text-xs">
                        ({message.usage.reasoning_tokens} reasoning, {message.usage.summary_tokens} summary)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="text-muted-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 animate-pulse" />
              Reasoning... {loadingTime}ms
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </form>
    </div>
  )
}
