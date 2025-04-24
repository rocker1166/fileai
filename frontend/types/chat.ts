export interface ContextSnippet {
  page: number
  text: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sourcePages?: number[]
  contextSnippets?: ContextSnippet[]
  error?: boolean
}
