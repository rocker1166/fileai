"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { motion } from "framer-motion"
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Document } from "@/types/document"

interface UploadSectionProps {
  onDocumentUploaded: (document: Document) => void
}

export default function UploadSection({ onDocumentUploaded }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setError(null)
    } else {
      setError("Please upload a valid PDF file")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  const uploadFile = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 300)

      const response = await fetch("https://fileai.onrender.com/upload_pdf", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        setUploadProgress(100)
        const data = await response.json()

        // Create document object from response
        const newDocument: Document = {
          id: data.document_id,
          filename: data.filename,
          uploaded_at: new Date().toISOString(),
        }

        // Initialize an empty chat history for this document
        localStorage.setItem(`chat-history-${newDocument.id}`, JSON.stringify([{
          id: "welcome",
          role: "assistant",
          content: `I've analyzed "${newDocument.filename}". Ask me anything about it!`,
          timestamp: new Date(),
        }]))

        // Update uploaded documents in localStorage
        const existingDocs = localStorage.getItem('uploaded-documents')
        const documents = existingDocs ? JSON.parse(existingDocs) : []
        const updatedDocs = [newDocument, ...documents.filter((doc: Document) => doc.id !== newDocument.id)]
        localStorage.setItem('uploaded-documents', JSON.stringify(updatedDocs))

        onDocumentUploaded(newDocument)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to upload PDF")
      }
    } catch (error) {
      setError("An error occurred while uploading the file")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Upload Your PDF</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload a PDF document to chat with its contents</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-300 hover:border-purple-400 dark:border-gray-700"
          }`}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={{
              y: isDragActive ? [0, -10, 0] : 0,
            }}
            transition={{
              repeat: isDragActive ? Number.POSITIVE_INFINITY : 0,
              duration: 1.5,
            }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Upload className="h-8 w-8 text-purple-600" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-lg font-medium mb-1 flex items-center justify-center">
                  <FileText className="mr-2 h-5 w-5" />
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? "Drop your PDF here" : "Drag & drop your PDF here"}
                </p>
                <p className="text-sm text-gray-500">or click to browse files</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {isUploading && (
            <div className="w-full max-w-md mb-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600"
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                />
              </div>
              <p className="text-sm text-center mt-2 text-gray-600">
                {uploadProgress < 100 ? "Processing your document..." : "Document processed successfully!"}
              </p>
            </div>
          )}

          <Button onClick={uploadFile} disabled={isUploading} size="lg" className="px-8">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
