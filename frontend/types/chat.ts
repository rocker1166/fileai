export interface ContextSnippet {
  page: number
  text: string
}

export interface Message {
  id?: string;  // Used for both local messages and AI response message_id
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  error?: boolean;
  sourcePages?: number[];
  contextSnippets?: {
    page: number;
    text: string;
  }[];
}

export interface FeedbackState {
  messageId: string;
  isHelpful: boolean;
}
