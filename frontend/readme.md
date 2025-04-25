# FileAI Frontend

A modern Next.js-based frontend for an AI-powered document analysis and chat interface. Built with React 18, TypeScript, and Tailwind CSS.

## Features

- 📱 Responsive design with mobile-first approach
- 🌓 Light/Dark theme support with system preference detection
- 📄 PDF document upload and management
- 💬 AI-powered chat interface for document interaction
- 📚 Document history and management
- ⚡ Real-time chat with streaming responses
- 🎨 Modern UI components using shadcn/ui
- 🔍 Markdown and math equation rendering support, table, code block , bullets support

## Tech Stack

- **Framework**: Next.js 14 (react 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Radix UI primitives
  - shadcn/ui components
  - Framer Motion for animations
- **State Management**: React Hooks
- **Data Fetching**: Native fetch API
- **Development Tools**:
  - pnpm for package management
  - ESLint for code linting
  - Prettier for code formatting

## Project Structure

```
frontend/
├── app/                   # Next.js app directory
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page component
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── chat-interface   # Chat functionality
│   ├── document-history # Document management
│   └── upload-section   # File upload handling
├── hooks/               # Custom React hooks
├── lib/                # Utility functions
├── public/             # Static assets
├── styles/            # Additional styles
└── types/             # TypeScript type definitions
```

## Key Components

- **ChatInterface**: Handles real-time communication with the AI
- **DocumentHistory**: Manages uploaded documents and chat history
- **UploadSection**: Handles document upload with drag-and-drop support
- **ThemeProvider**: Manages application theming
- **UI Components**: Collection of reusable components built on Radix UI

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fileai/frontend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

5. **Build for production**:
   ```bash
   pnpm build
   pnpm start
   ```

## Features in Detail

### Document Management
- Drag-and-drop file upload
- PDF document processing
- Document history and status tracking
- Delete and manage uploaded documents

### Chat Interface
- Real-time AI responses
- Markdown rendering support
- Code syntax highlighting
- Math equation rendering with KaTeX
- Message history preservation
- Voice input support (where available)

### UI/UX Features
- Responsive design for all screen sizes
- Dark/Light theme switching
- Smooth transitions and animations
- Loading states and error handling
- Toast notifications for system messages
- Keyboard shortcuts and accessibility

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.