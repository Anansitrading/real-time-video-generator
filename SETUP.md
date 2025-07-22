# Setup Guide for Real-Time Video Generator

This guide will help you set up the Real-Time Video Generator on your local machine.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Supabase account
- Gemini API access
- Fal.ai account

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/Anansitrading/real-time-video-generator.git
cd real-time-video-generator
npm install
# or
pnpm install
```

### 2. Supabase Project Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Get your project credentials**:
   - Go to Settings > API
   - Copy your `Project URL` and `anon public` key

3. **Run database migrations**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of each file in `supabase/migrations/` in order:
     - `1753144937_create_video_generator_schema.sql`
     - `1753145008_create_video_generator_schema.sql` 
     - `1753145022_enable_rls_and_policies.sql`

4. **Deploy Edge Functions**:
   
   If you have Supabase CLI installed:
   ```bash
   supabase functions deploy
   ```
   
   Or manually create each function in the Supabase dashboard using the code from `supabase/functions/*/index.ts`

5. **Set environment variables in Supabase**:
   - Go to Settings > Environment Variables
   - Add these variables:
     - `GEMINI_API_KEY` - Your Gemini API key
     - `FAL_API_KEY` - Your Fal.ai API key
     - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (from Settings > API)

### 3. API Keys Setup

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Make sure Gemini Live API access is enabled

#### Fal.ai API Key
1. Sign up at [fal.ai](https://fal.ai)
2. Go to your dashboard and generate an API key
3. Ensure you have access to Veo 3 models

### 4. Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local`** with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Fix hardcoded Supabase URL** in `src/lib/supabase.ts`:
   ```typescript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

### 5. Run the Application

```bash
npm run dev
# or
pnpm dev
```

The application should now be running at `http://localhost:5173`

## Features to Test

1. **Authentication**: Sign up/sign in functionality
2. **Voice Interaction**: Click the microphone to start voice chat
3. **Video Generation**: Describe a video and watch it generate
4. **Chat History**: Your conversations are saved
5. **Real-time Updates**: Messages and videos update in real-time

## Troubleshooting

### Common Issues

1. **Button clicks not working**: This is a known issue with the deployed version. The local version should work correctly.

2. **Supabase connection errors**: 
   - Verify your environment variables are correct
   - Check that RLS policies are properly set up
   - Ensure your API keys are valid

3. **Voice recording not working**:
   - Make sure you're using HTTPS (required for microphone access)
   - Check browser permissions for microphone access

4. **Video generation failing**:
   - Verify your Fal.ai API key is correct
   - Check that you have access to Veo 3 models
   - Look at the edge function logs in Supabase

### Debugging

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** in the dashboard under Logs
3. **Verify edge function logs** for backend errors

## Production Deployment

For production deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**:
   - Vercel (recommended)
   - Netlify
   - Custom server

3. **Update environment variables** in your deployment platform

4. **Configure production Supabase settings**:
   - Update CORS settings if needed
   - Configure proper rate limiting
   - Set up monitoring and alerts

## Support

If you encounter any issues:

1. Check this setup guide first
2. Look at the GitHub issues
3. Create a new issue with detailed error information

## Next Steps

Once you have the basic setup working:

1. **Customize the UI** to match your brand
2. **Add new video generation features**
3. **Implement user analytics**
4. **Set up monitoring and error tracking**
5. **Optimize performance** for your use case

---

**Happy coding! 🚀**