# 🚀 Real-Time Video Generator Setup Guide

This guide provides step-by-step instructions to set up and run the Real-Time Video Generator application.

## 🚨 **Critical Prerequisites**

Before starting, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier works)
- Access to Gemini API (Google AI Studio)
- Access to Fal.ai API
- Git installed

## ⚡ **Quick Start (5 Steps)**

### **Step 1: Clone & Install**
```bash
git clone https://github.com/Anansitrading/real-time-video-generator.git
cd real-time-video-generator
npm install
```

### **Step 2: Create Supabase Project**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and fill project details
4. Wait for project to be ready (2-3 minutes)
5. **Save your project URL and anon key** (found in Settings → API)

### **Step 3: Configure Environment Variables**
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual Supabase credentials
# Replace these values:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### **Step 4: Set Up Database**
1. Go to your Supabase Dashboard → SQL Editor
2. Run these migration files **in order**:

**Migration 1:** Copy and execute `supabase/migrations/1753144937_create_video_generator_schema.sql`
**Migration 2:** Copy and execute `supabase/migrations/1753145008_create_video_generator_schema.sql`  
**Migration 3:** Copy and execute `supabase/migrations/1753145022_enable_rls_and_policies.sql`

3. Verify tables are created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Step 5: Deploy Edge Functions & Get API Keys**

#### **Deploy Edge Functions:**
**Option A: Using Supabase CLI (Recommended)**
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy
```

**Option B: Manual Deployment**
1. Go to Supabase Dashboard → Functions
2. Create each function using code from `supabase/functions/*/index.ts`

#### **Get Required API Keys:**

**Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Ensure you have access to Gemini Live API

**Fal.ai API Key:**
1. Go to [Fal.ai Dashboard](https://fal.ai/dashboard)
2. Sign up and get API key
3. Ensure you have access to Veo 3 models

#### **Set Environment Variables in Supabase:**
1. Go to Supabase Dashboard → Settings → Environment Variables
2. Add these variables:
```
GEMINI_API_KEY=your_gemini_api_key
FAL_API_KEY=your_fal_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Step 6: Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application!

## ✅ **Verification Checklist**

Test these features to ensure everything works:

- [ ] **Authentication**: Can create account and sign in
- [ ] **Profile Creation**: User profile appears after sign in
- [ ] **Chat Sessions**: Can create new conversation
- [ ] **Text Messages**: Can send and receive messages
- [ ] **Database Operations**: Messages save and load properly
- [ ] **Edge Functions**: No console errors for function calls
- [ ] **UI Responsiveness**: Buttons work and interface is responsive

## 🐛 **Troubleshooting Common Issues**

### **Issue: "Missing Supabase environment variables"**
**Solution**: Ensure `.env.local` exists with correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

### **Issue: "Failed to create session" or database errors**
**Solution**: 
1. Verify all migrations were run successfully
2. Check RLS policies are enabled
3. Ensure you're signed in to the application

### **Issue: "Failed to connect to voice assistant"**
**Solution**:
1. Check GEMINI_API_KEY is set in Supabase environment variables
2. Verify edge functions are deployed
3. Check browser console for specific error messages

### **Issue: "Video generation failed"**
**Solution**:
1. Check FAL_API_KEY is set in Supabase environment variables
2. Ensure you have access to Fal.ai Veo 3 models
3. Check if you have sufficient credits/quota

### **Issue: Edge functions not found**
**Solution**:
1. Redeploy functions using `supabase functions deploy`
2. Check function names match exactly: `chat-session-manager`, `fal-video-generate`, etc.
3. Verify functions appear in Supabase Dashboard → Functions

## 🔒 **Security Best Practices**

1. **Never commit API keys** to Git
2. **Use environment variables** for all sensitive data
3. **Keep .env.local** in your .gitignore file
4. **Use service role key** only in Supabase edge functions
5. **Regenerate keys** if accidentally exposed

## 🏗️ **Production Deployment**

For production deployment:

1. **Frontend**: Deploy to Vercel, Netlify, or similar
   - Set environment variables in deployment platform
   - Update CORS settings in Supabase if needed

2. **Backend**: Edge functions are already deployed to Supabase
   - Monitor function logs in Supabase Dashboard
   - Set up usage alerts for API quotas

3. **Database**: Supabase handles hosting
   - Set up automated backups
   - Monitor performance metrics

## 📞 **Need Help?**

If you encounter issues:

1. **Check browser console** for error messages
2. **Review Supabase logs** in Dashboard → Logs
3. **Verify API quotas** haven't been exceeded
4. **Test edge functions** individually in Supabase Dashboard

## 🎯 **What's Next?**

Once everything is working:
- Customize the UI theme and branding
- Add more video generation models
- Implement user settings and preferences
- Add audio transcription features
- Scale for production usage

---

**🎉 Congratulations!** You now have a fully functional Real-Time Video Generator with voice interactions and AI video generation capabilities.