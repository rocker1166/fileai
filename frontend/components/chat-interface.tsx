"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Document } from "@/types/document"
import type { Message, ContextSnippet } from "@/types/chat"
import MessageItem from "@/components/message-item"

interface ChatInterfaceProps {
  document: Document
}

export default function ChatInterface({ document }: ChatInterfaceProps) {
  const storageKey = `chat-history-${document.id}`
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages from localStorage when document changes
  useEffect(() => {
    const loadMessages = () => {
      try {
        const savedMessages = localStorage.getItem(storageKey)
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages, (key, value) => {
            // Convert timestamp strings back to Date objects
            if (key === 'timestamp') {
              return new Date(value)
            }
            return value
          })
          setMessages(parsedMessages)
        } else {
          // Set initial welcome message if no history exists
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: `I've analyzed "${document.filename}". Ask me anything about it!`,
            timestamp: new Date(),
          }])
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
        // Fallback to initial state if there's an error
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `I've analyzed "${document.filename}". Ask me anything about it!`,
          timestamp: new Date(),
        }])
      }
    }
    loadMessages()
  }, [document.id, storageKey])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages))
      } catch (error) {
        console.error("Error saving chat history:", error)
      }
    }
  }, [messages, storageKey])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("https://fileai.onrender.com/ask_question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: document.id,
          question: input,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const contextSnippets: ContextSnippet[] = data.context_snippets.map((snippet: any) => ({
          page: snippet.page,
          text: snippet.text,
        }))

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          sourcePages: data.source_pages,
          contextSnippets: contextSnippets,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()

        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
          timestamp: new Date(),
          error: true,
        }

        setMessages((prev) => [...prev, errorMessage])
        console.error("Error asking question:", errorData)
      }
    } catch (error) {
      console.error("Error asking question:", error)

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
        error: true,
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b flex items-center space-x-2 bg-gray-50 dark:bg-gray-900">
        <FileText className="h-5 w-5 text-purple-600" />
        <h3 className="font-medium truncate">{document.filename}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 max-w-[80%]"
          >
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Thinking...</p>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            className="flex-1 resize-none"
            rows={1}
            maxRows={5}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
