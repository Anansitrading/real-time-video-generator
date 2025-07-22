# 🎥 Real-Time Video Generator

A sophisticated web application that enables **real-time voice conversations** with AI to generate custom videos using cutting-edge technology.

## 🚨 **Recent Critical Fixes Applied**

This repository has been **updated with essential fixes** to resolve blocking issues:

✅ **Fixed hardcoded Supabase credentials** - Now uses proper environment variables  
✅ **Fixed authentication flow issues** - Resolved infinite loading states  
✅ **Fixed button click event handling** - Buttons now work properly  
✅ **Fixed WebSocket connection logic** - Improved error handling and reconnection  
✅ **Enhanced environment configuration** - Clear separation of frontend/backend vars  
✅ **Updated setup documentation** - Step-by-step instructions for success  

**⚠️ Important**: This application requires **your own Supabase project** and API keys. Follow the [Setup Guide](SETUP.md) for complete configuration.

## 🌟 Features

- **Real-time Voice Conversations** with Gemini Live API
- **Video Generation** via Fal.ai Veo 3 with queue-based processing
- **React 18+ with TypeScript** and optimized performance
- **Supabase Real-time Database** for chat persistence and video management
- **Advanced Error Handling** with exponential backoff reconnection logic
- **Session Persistence** that can resume interrupted conversations
- **Mobile-Responsive Design** with accessibility features
- **Production-ready Security** with ephemeral token management
- **Modern Futuristic UI** with dark theme and neon accents

## 🚀 Tech Stack

- **Frontend**: React 18+, TypeScript, Vite, Zustand
- **UI**: Tailwind CSS, Framer Motion, shadcn/ui components
- **Backend**: Supabase (Database, Real-time, Authentication, Edge Functions)
- **AI Services**: 
  - Gemini Live API for voice interactions
  - Fal.ai Veo 3 for video generation
- **Audio Processing**: Web Audio API with 16-bit PCM, 16kHz
- **Real-time**: WebSocket connections with automatic reconnection

## ⚡ **Quick Installation**

```bash
# 1. Clone and install
git clone https://github.com/Anansitrading/real-time-video-generator.git
cd real-time-video-generator
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
npm run dev
```

## 📋 **Complete Setup Required**

This is just the basic installation. For the application to work properly, you **MUST** follow the complete setup process:

👉 **[Read the Full Setup Guide](SETUP.md)** 👈

The setup guide includes:
- Creating your Supabase project
- Running database migrations  
- Deploying edge functions
- Configuring API keys (Gemini, Fal.ai)
- Environment variable configuration
- Troubleshooting common issues

5. **API Configuration**:
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Get a Fal.ai API key from [Fal.ai](https://fal.ai)
   - Set these in your Supabase project environment variables

6. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🌐 Live Demo

*Note: A live demo requires proper API key configuration and cannot be provided as a public demo due to API costs and security considerations.*

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat interface components
│   ├── ui/             # Reusable UI components
│   └── video/          # Video generation components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── stores/             # Zustand state management
└── types/              # TypeScript type definitions

supabase/
├── functions/          # Edge functions for backend logic
├── migrations/         # Database schema migrations
└── tables/             # Individual table definitions
```

## 🔧 Key Features Implementation

### Voice Interaction
- Real-time audio capture using Web Audio API
- WebSocket connection to Gemini Live for bidirectional communication
- Automatic silence detection and session management
- Support for multiple languages with auto-detection

### Video Generation
- Integration with Fal.ai's Veo 3 for high-quality video generation
- Queue-based processing with webhook notifications
- Real-time status updates and progress tracking
- Support for custom prompts and duration settings

### Real-time Database
- Supabase for persistent chat sessions and user management
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Optimized queries with proper indexing

## 🔒 Security Features

- **Ephemeral Token Management**: Secure, time-limited tokens for API access
- **Row Level Security**: Database-level access control
- **Environment Variable Protection**: Sensitive data stored securely
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Comprehensive validation for all user inputs

## 🎯 Performance Optimizations

- **Code Splitting**: Lazy loading of components for faster initial load
- **State Management**: Efficient Zustand stores with minimal re-renders
- **Database Indexing**: Optimized queries for <100ms response times
- **WebSocket Reconnection**: Exponential backoff for reliable connections
- **Error Boundaries**: Graceful error handling throughout the application

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini Live API](https://ai.google.dev/gemini-api/docs/live) for advanced voice interactions
- [Fal.ai](https://fal.ai) for cutting-edge video generation capabilities
- [Supabase](https://supabase.com) for the powerful backend-as-a-service platform
- [React](https://reactjs.org) and the amazing React ecosystem

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the [Setup Guide](SETUP.md) for detailed configuration instructions
2. Review the troubleshooting section for common issues
3. Open an issue on GitHub with detailed error information

---

**Built with ❤️ using modern web technologies for the future of AI-powered video creation.**