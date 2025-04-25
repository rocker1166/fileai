import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

interface SuggestionsProps {
  onSelect: (suggestion: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

const dummyQuestions = [
  "What are the main topics covered in this document?",
  "Can you summarize the key findings of this document?",
  "Who are you?",
  "What is the purpose of this document?",
  "Tell me about the author of this document.",
]

export function Suggestions({ onSelect, onMouseEnter, onMouseLeave, className }: SuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute bottom-full mb-2 w-full space-y-1 rounded-lg border bg-background p-2 shadow-lg",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {dummyQuestions.map((question, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            transition: { delay: index * 0.1 } 
          }}
          onClick={() => onSelect(question)}
          className="w-full rounded-md px-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {question}
        </motion.button>
      ))}
    </motion.div>
  )
}