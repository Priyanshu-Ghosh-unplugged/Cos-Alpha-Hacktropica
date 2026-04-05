# Gemini API Setup Guide

The Gemini API provides intelligent natural language to command interpretation. Follow these steps to set it up:

## 🚀 Quick Setup

### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key (starts with `AIza...`)

### 2. Configure Environment
1. Create a `.env` file in your project root (same level as `package.json`)
2. Add your API key:

```bash
VITE_GOOGLE_GEMINI_API_KEY=AIza...your_actual_api_key_here
```

### 3. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Restart it
npm run dev
# or
yarn dev
```

### 4. Test Setup
Open your browser console and run:
```javascript
testGeminiAPI()
```

You should see: `✅ API call successful`

## 🔧 Troubleshooting

### Issue: "API key not configured"
**Solution**: 
- Ensure `.env` file exists in project root
- Check that API key is correctly formatted
- Restart development server after creating `.env`

### Issue: "Empty response from Gemini"
**Solution**:
- Check your API key is valid and active
- Verify you have API quota available
- Try a different network connection

### Issue: Low confidence results
**Solution**:
- This is normal! The system falls back to pattern matching for complex queries
- Try simpler, more direct commands
- The hybrid system still works well with pattern matching

## 🧪 Testing Commands

Once configured, try these natural language commands:

```bash
# File operations
"show me all files"
"create a folder called myproject"
"delete the old folder"

# Navigation  
"go to the documents folder"
"what's my current directory"

# System info
"show system information"
"what time is it"
"list running processes"
```

## 📊 Current Status

To check your Gemini API status at any time:
```javascript
// In browser console
getGeminiStatus()
```

This will show:
- ✅ **Configured**: API key is set
- ✅ **Initialized**: API connection successful  
- ❌ **Error**: Any connection issues
- 💡 **Setup Instructions**: If not configured

## 🔐 Security Notes

- **Never commit your `.env` file** to version control
- The `.env` file is already included in `.gitignore`
- API keys are sensitive - treat them like passwords
- You can regenerate API keys from Google AI Studio if needed

## 🆘 Still Having Issues?

1. **Check the console**: Open browser dev tools and look for error messages
2. **Verify API key**: Ensure it starts with `AIza...` and not the placeholder text
3. **Network issues**: Some corporate networks may block API calls
4. **API quota**: Free tier has limits - check Google AI Studio for usage

## 🎯 How It Works

The system uses a hybrid approach:
1. **Primary**: Gemini API for intelligent interpretation
2. **Fallback**: Pattern matching for common commands
3. **Final**: Direct command parsing

This ensures the terminal always works, even without Gemini API configured!
