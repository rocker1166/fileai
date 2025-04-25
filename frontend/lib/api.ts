// API service functions

export async function uploadPdf(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("https://fileai.onrender.com/upload_pdf", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload PDF")
  }

  return response.json()
}

export async function askQuestion(documentId: string, question: string) {
  const response = await fetch("https://fileai.onrender.com/ask_question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document_id: documentId,
      question,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to get answer")
  }

  return response.json()
}

export async function getDocumentStatus(documentId: string) {
  const response = await fetch(`https://fileai.onrender.com/document_status/${documentId}`)

  if (!response.ok) {
    throw new Error("Failed to get document status")
  }

  return response.json()
}

export async function listDocuments() {
  const response = await fetch("https://fileai.onrender.com/documents")

  if (!response.ok) {
    throw new Error("Failed to list documents")
  }

  return response.json()
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`https://fileai.onrender.com/document/${documentId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete document")
  }

  return response.json()
}
