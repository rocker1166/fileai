"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Bot, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"

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
          rounded-lg p-4 max-w-[80%] space-y-2
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
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${message.role === "user" ? "bg-purple-700" : "bg-gray-200 dark:bg-gray-700"}
          `}
          >
            {message.role === "user" ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>

          <div className="flex-1">
            <p
              className={`
              ${message.role === "user" ? "text-white" : "text-gray-800 dark:text-gray-200"}
            `}
            >
              {message.content}
            </p>

            {message.sourcePages && message.sourcePages.length > 0 && (
              <div className="mt-2 text-xs text-purple-200 dark:text-purple-300 flex flex-wrap gap-1">
                {message.sourcePages.map((page) => (
                  <span key={page} className="bg-purple-700 dark:bg-purple-800 px-2 py-0.5 rounded-full">
                    Page {page}
                  </span>
                ))}
              </div>
            )}

            {hasContext && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center p-0 h-auto text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
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
                        className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-800 dark:text-gray-300"
                      >
                        <div className="flex items-center text-purple-600 dark:text-purple-400 mb-1">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="font-medium">Page {snippet.page}</span>
                        </div>
                        <p className="line-clamp-4 text-gray-700 dark:text-gray-300">{snippet.text}</p>
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
