# 🤖 Google Gemini API Setup for Quiz Beef

## Overview
Quiz Beef uses Google's Gemini AI to generate intelligent quiz questions from uploaded content. This guide explains how to set up the API integration.

## Prerequisites
- Google Cloud Platform account (free tier available)
- Access to Google AI Studio or Google Cloud Console

## Step 1: Get Your Gemini API Key

### Option A: Google AI Studio (Recommended for Development)
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" in the top navigation
3. Sign in with your Google account
4. Click "Create API Key"
5. Choose "Create API key in new project" (recommended)
6. Copy the generated API key

### Option B: Google Cloud Console (For Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Generative Language API"
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "API Key"
6. Restrict the API key to the Generative Language API
7. Copy the API key

## Step 2: Configure Quiz Beef

### Environment Setup
Create a `.env.server` file in the project root with:

```bash
# Google Gemini AI API Key for Quiz Generation
GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

### Important Security Notes
- ⚠️ **Never commit your API key to version control**
- ✅ Add `.env.server` to `.gitignore` (already done)
- ✅ Use different API keys for development and production
- ✅ Set up API key restrictions in Google Cloud Console

## Step 3: Test the Integration

1. Start Quiz Beef: `wasp start`
2. Upload a document (PDF or text)
3. Click "Generate Quiz" on any document card
4. Wait for AI processing (usually 10-30 seconds)
5. Verify questions are generated and saved

## API Usage & Limits

### Free Tier Limits (Google AI Studio)
- **Requests**: 60 requests per minute
- **Tokens**: 1 million tokens per minute
- **Daily limit**: No specified daily limit for free tier

### Rate Limiting in Quiz Beef
Quiz Beef automatically handles rate limiting by:
- Checking for existing questions before generating new ones
- Implementing exponential backoff for retries
- Providing clear error messages for API failures

## Troubleshooting

### Common Issues

**"Failed to generate quiz: Invalid API key"**
- Verify your API key is correct in `.env.server`
- Ensure the API key has access to Generative Language API
- Check that the key isn't restricted to specific IPs/domains

**"Failed to generate quiz: Quota exceeded"**
- You've hit the rate limit - wait a few minutes
- Consider upgrading to paid tier for higher limits
- Check Google Cloud Console for quota details

**"Failed to generate quiz: Model not found"**
- The Gemini Pro model may not be available in your region
- Try using a different model in `src/features/documents/aiService.ts`

**"Generated questions are low quality"**
- Upload content with more substantial text (500+ words recommended)
- Ensure content is educational/informational rather than just narrative
- Try different difficulty settings or question types

### Debug Mode
To enable detailed AI processing logs, set in `.env.server`:
```bash
WASP_LOG_LEVEL=debug
```

## Cost Optimization

### Tips to Minimize API Costs
1. **Avoid Duplicate Generation**: Quiz Beef automatically prevents regenerating questions for the same document
2. **Content Quality**: Higher quality input content leads to better questions with fewer retries
3. **Batch Processing**: Generate multiple questions per request rather than one at a time
4. **Content Length**: Very long documents are automatically truncated to optimize token usage

### Monitoring Usage
- Check Google Cloud Console for API usage statistics
- Set up billing alerts to avoid unexpected charges
- Monitor the Quiz Beef server logs for API call frequency

## Production Deployment

### Environment Variables
For production deployment, set:
```bash
GOOGLE_GEMINI_API_KEY=your_production_api_key
```

### Security Best Practices
- Use Google Cloud Secret Manager for API key storage
- Set up API key rotation schedule
- Monitor API usage for anomalies
- Implement application-level rate limiting

## Support

If you encounter issues:
1. Check the [Google AI documentation](https://ai.google.dev/docs)
2. Review Quiz Beef server logs for detailed error messages
3. Verify your API key permissions in Google Cloud Console
4. Test API connectivity with a simple curl command:

```bash
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Test"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

---

**🎯 Once configured, Quiz Beef will automatically generate intelligent, educational quiz questions from any uploaded content!**
