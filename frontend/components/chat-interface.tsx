"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, FileText, Loader2, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Document } from "@/types/document"
import type { Message } from "@/types/chat"
import MessageItem from "@/components/message-item"
import { useIsMobile } from "@/hooks/use-mobile"
import { Suggestions } from "@/components/ui/suggestions"

// Add WebSpeech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInterfaceProps {
  document: Document
}

export default function ChatInterface({ document }: ChatInterfaceProps) {
  const storageKey = `chat-history-${document.id}`
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const recognition = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        
        recognition.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map(result => result.transcript)
            .join('');
          
          setInput(prev => prev + ' ' + transcript);
        };

        recognition.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

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

  const toggleMicrophone = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      recognition.current?.start();
      setIsListening(true);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setIsSelectingSuggestion(false)
    setShowSuggestions(false)
    setInput(suggestion)
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
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          sourcePages: data.source_pages,
          contextSnippets: data.context_snippets.map((snippet: any) => ({
            page: snippet.page,
            text: snippet.text,
          })),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
          timestamp: new Date(),
          error: true,
        }
        setMessages((prev) => [...prev, errorMessage])
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
    <div className="flex flex-col h-[100vh] md:h-[85vh] w-full bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
      <div className="p-3 md:p-4 border-b flex items-center space-x-2 bg-gray-50 dark:bg-gray-900">
        <FileText className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
        <h3 className="font-medium text-sm md:text-base truncate">{document.filename}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 md:p-4 rounded-lg bg-gray-100 dark:bg-gray-800 max-w-[80%]"
          >
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Thinking...</p>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 border-t bg-white dark:bg-gray-950">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 flex flex-col space-y-2 relative">
            {showSuggestions && (
              <Suggestions 
                onSelect={handleSuggestionSelect}
                onMouseEnter={() => setIsSelectingSuggestion(true)}
                onMouseLeave={() => setIsSelectingSuggestion(false)} 
              />
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                if (!isSelectingSuggestion) {
                  setTimeout(() => setShowSuggestions(false), 200)
                }
              }}
              placeholder="Ask a question about the document..."
              className="flex-1 resize-none text-sm md:text-base min-h-[44px] focus-visible:ring-1"
              rows={1}
              maxRows={5}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
          </div>
          
          <div className="flex space-x-2">
            {window.SpeechRecognition || window.webkitSpeechRecognition ? (
              <Button
                type="button"
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={toggleMicrophone}
                className={`transition-colors ${isListening ? "bg-purple-100 dark:bg-purple-900/20" : ""}`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-purple-600" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isListening ? "Stop voice input" : "Start voice input"}
                </span>
              </Button>
            ) : null}

            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size={isMobile ? "sm" : "default"}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
