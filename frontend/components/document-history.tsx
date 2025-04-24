"use client"

import { motion } from "framer-motion"
import { FileText, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Document } from "@/types/document"

interface DocumentHistoryProps {
  documents: Document[]
  activeDocumentId: string | undefined
  onDocumentSelect: (document: Document) => void
  onDocumentDelete: (documentId: string) => void
}

export default function DocumentHistory({
  documents,
  activeDocumentId,
  onDocumentSelect,
  onDocumentDelete,
}: DocumentHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Document History</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {documents.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                p-3 rounded-lg cursor-pointer flex items-start group relative
                ${
                  activeDocumentId === document.id
                    ? "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent"
                }
                border transition-colors
              `}
              onClick={() => onDocumentSelect(document)}
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{document.filename}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(document.uploaded_at)}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 absolute right-2 top-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onDocumentDelete(document.id)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
