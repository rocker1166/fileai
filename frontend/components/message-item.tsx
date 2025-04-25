"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Bot, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const [showContext, setShowContext] = useState(false)
  const hasContext = message.contextSnippets && message.contextSnippets.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          rounded-lg p-3 md:p-4 max-w-[85%] md:max-w-[75%] space-y-2
          ${
            message.role === "user"
              ? "bg-purple-600 text-white"
              : message.error
                ? "bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-gray-100 dark:bg-gray-800"
          }
        `}
      >
        <div className="flex items-start space-x-2">
          <div
            className={`
              w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${message.role === "user" ? "bg-purple-700" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            {message.role === "user" ? (
              <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
            ) : (
              <Bot className="h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={`
                prose prose-sm md:prose-base max-w-none
                ${message.role === "user" ? "prose-invert" : "prose-neutral dark:prose-invert"}
                ${message.role === "user" ? "text-white" : "text-gray-800 dark:text-gray-200"}
              `}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Override default styling for specific elements
                  a: ({ children, href }) => (
                    <a 
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside my-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside my-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  // Remove the custom li component to let ReactMarkdown handle it properly
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-800/20 dark:bg-gray-100/10 rounded px-1 py-0.5 text-sm">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {message.sourcePages && message.sourcePages.length > 0 && (
              <div className="mt-2 text-xs flex flex-wrap gap-1">
                {message.sourcePages.map((page) => (
                  <span key={page} className="bg-purple-700 dark:bg-purple-800 px-2 py-0.5 rounded-full text-white text-[10px] md:text-xs">
                    Page {page}
                  </span>
                ))}
              </div>
            )}

            {hasContext && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] md:text-xs flex items-center p-0 h-auto text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  onClick={() => setShowContext(!showContext)}
                >
                  {showContext ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide source context
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show source context
                    </>
                  )}
                </Button>

                {showContext && message.contextSnippets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2"
                  >
                    {message.contextSnippets.map((snippet, index) => (
                      <div
                        key={index}
                        className="text-[10px] md:text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-800 dark:text-gray-300"
                      >
                        <div className="flex items-center text-purple-600 dark:text-purple-400 mb-1">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="font-medium">Page {snippet.page}</span>
                        </div>
                        <p className="line-clamp-4">{snippet.text}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
