# FileAI - AI-Powered Document Analysis Platform

FileAI is an intelligent document analysis and chat interface that helps you interact with your documents using AI. Built with Next.js, FastAPI, and Google's Gemini AI model.

**Deployed Link:** https://fileai.vercel.app/ 

**Demo Video:** https://youtu.be/2dx9qERmmM0

**Project Overview:** https://sleepy-soy-89f.notion.site/HLD-LLD-of-FileAi-1d0010dc67c2803598d4f529fddebd40?pvs=4

**Full Code Documentation:** https://sleepy-soy-89f.notion.site/Complete-Source-Code-Documentation-1e0010dc67c280099a77eafe7fa43c24?pvs=4

## 🌟 Key Features

- 📄 PDF Document Processing
  - Upload and process PDF documents
  - Semantic chunking and vector embeddings
  - Efficient document management
  
- 🤖 AI-Powered Analysis
  - Intelligent question answering using Gemini AI
  - Semantic search capabilities
  - Context-aware responses with source citations
  
- 💬 Interactive Chat Interface
  - Real-time chat with streaming responses
  - Markdown and math equation rendering
  - Code syntax highlighting
  - Voice input support (where available)
  - Feedback System
  
- 🎨 Modern User Experience
  - Responsive design for all devices
  - Light/Dark theme with system preference
  - Drag-and-drop file upload
  - Document history tracking

## 🏗️ Architecture

The project consists of two main components:

### Frontend (Next.js)
- Built with Next.js 14 and React 18
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components
- Framer Motion for animations

### Backend (FastAPI)
- Python FastAPI framework
- Supabase for storage and vector search
- Google Gemini AI for question answering
- Asynchronous document processing
- Caching for improved performance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.8+
- Supabase account
- Google Gemini API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key
```

4. Start the backend server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 📝 API Documentation

The backend provides the following main endpoints:

- `POST /upload`: Upload PDF documents
- `POST /ask_question`: Ask questions about documents
- `GET /documents`: List uploaded documents
- `GET /document/{id}`: Get document status
- `DELETE /document/{id}`: Delete a document

For detailed API documentation, refer to the backend README.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✨ Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [FastAPI](https://fastapi.tiangolo.com/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
