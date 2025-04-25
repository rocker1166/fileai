"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Bot, ChevronDown, ChevronUp, FileText, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { submitFeedback } from "@/lib/api"

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const [showContext, setShowContext] = useState(false)
  const hasContext = message.contextSnippets && message.contextSnippets.length > 0
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (isHelpful: boolean) => {
    if (!message.id || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitFeedback({
        message_id: message.id,
        is_helpful: isHelpful
      })
      setFeedback(isHelpful)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
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
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
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
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 my-2 italic">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  code: ({ className, children, inline, ...props }: { className?: string; children?: React.ReactNode; inline?: boolean; [key: string]: any }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    // Filter out potentially problematic props
                    const safeProps = Object.fromEntries(
                      Object.entries(props).filter(([key]) => 
                        !["nodeRef", "ref", "key", "inline"].includes(key)
                      )
                    );
                    return !inline ? (
                      <pre className="p-4 rounded-lg bg-gray-800 dark:bg-gray-900 overflow-x-auto">
                        <code className={className} {...safeProps}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-800/20 dark:bg-gray-100/10 rounded px-1 py-0.5 text-sm" {...safeProps}>
                        {children}
                      </code>
                    )
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-sm font-semibold bg-gray-200 dark:bg-gray-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-sm border-t border-gray-300 dark:border-gray-700">
                      {children}
                    </td>
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

            {message.role === "assistant" && message.id && (
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={isSubmitting || feedback !== null}
                  onClick={() => handleFeedback(true)}
                  className={feedback === true ? "text-green-500" : ""}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={isSubmitting || feedback !== null}
                  onClick={() => handleFeedback(false)}
                  className={feedback === false ? "text-red-500" : ""}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
