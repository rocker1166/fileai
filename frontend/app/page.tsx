"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, MessageSquare, FileText, Loader2, Moon, Sun, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import UploadSection from "@/components/upload-section"
import ChatInterface from "@/components/chat-interface"
import DocumentHistory from "@/components/document-history"
import type { Document } from "@/types/document"
import { useTheme } from "next-themes"
import ThemeSettings from "@/components/theme-settings"

export default function Home() {
  const [activeView, setActiveView] = useState<"upload" | "chat">("upload")
  const [activeDocument, setActiveDocument] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Load documents from localStorage only
    const savedDocs = localStorage.getItem('uploaded-documents')
    if (savedDocs) {
      try {
        const parsedDocs = JSON.parse(savedDocs)
        setDocuments(parsedDocs)
      } catch (error) {
        console.error("Error parsing saved documents:", error)
      }
    }

    // Check if there's a recently used document in localStorage
    const recentDocId = localStorage.getItem("recentDocumentId")
    if (recentDocId) {
      fetchDocumentStatus(recentDocId)
    }
  }, [])

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('uploaded-documents', JSON.stringify(documents))
    }
  }, [documents])

  const fetchDocumentStatus = async (documentId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://fileai.onrender.com/document_status/${documentId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.exists && data.is_vectorized) {
          setActiveDocument({
            id: data.id,
            filename: data.filename,
            uploaded_at: new Date().toISOString(), // Fallback since the status endpoint doesn't return this
          })
          setActiveView("chat")
        }
      }
    } catch (error) {
      console.error("Error fetching document status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUpload = (document: Document) => {
    setActiveDocument(document)
    setDocuments((prev) => {
      const newDocs = prev.filter(doc => doc.id !== document.id)
      return [document, ...newDocs]
    })
    setActiveView("chat")
    localStorage.setItem("recentDocumentId", document.id)
  }

  const handleDocumentSelect = (document: Document) => {
    setActiveDocument(document)
    setActiveView("chat")
    setShowHistory(false)
    localStorage.setItem("recentDocumentId", document.id)
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`https://fileai.onrender.com/document/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        localStorage.setItem('uploaded-documents', 
          JSON.stringify(documents.filter(doc => doc.id !== documentId))
        )
        
        if (activeDocument?.id === documentId) {
          setActiveDocument(null)
          setActiveView("upload")
          localStorage.removeItem("recentDocumentId")
          // Also remove chat history for this document
          localStorage.removeItem(`chat-history-${documentId}`)
        }
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          {/* Main header content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <motion.h1
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              FileAi
            </motion.h1>

            {/* Actions container */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <Button
                variant={activeView === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveView("upload")}
                className="whitespace-nowrap"
              >
                <Upload className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span>Upload</span>
              </Button>

              <Button
                variant={activeView === "chat" ? "default" : "outline"}
                size="sm"
                onClick={() => activeDocument && setActiveView("chat")}
                disabled={!activeDocument}
                className="whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span>Chat</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHistory(!showHistory)}
                className="whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="sm:inline">History</span>
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="gap-1.5 sm:gap-2"
                >
                  <Settings2 className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 flex-shrink-0"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {mounted && (theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  ))}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[70vh]"
            >
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            </motion.div>
          ) : activeView === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UploadSection onDocumentUploaded={handleDocumentUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeDocument && <ChatInterface document={activeDocument} />}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg rounded-l-xl p-4 z-10"
            >
              <DocumentHistory
                documents={documents}
                activeDocumentId={activeDocument?.id}
                onDocumentSelect={handleDocumentSelect}
                onDocumentDelete={handleDeleteDocument}
                onClose={() => setShowHistory(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ThemeSettings open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
}
