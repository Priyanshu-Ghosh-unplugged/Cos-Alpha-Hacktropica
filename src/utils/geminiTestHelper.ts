// Gemini API Test Helper - Diagnose and fix API issues

import { interpretWithGemini, getGeminiInterpreter, getGeminiStatus } from '@/lib/geminiInterpreter';

export const testGeminiAPI = async () => {
  console.log('🔍 Testing Gemini API Configuration...');
  
  // Check current status
  const status = getGeminiStatus();
  console.log('📊 Status:', status);
  
  if (!status.configured) {
    console.error('❌ Gemini API key not configured');
    console.log('💡 To fix this:');
    console.log('1. Get an API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Create a .env file in the project root');
    console.log('3. Add: VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here');
    console.log('4. Restart the development server');
    return false;
  }
  
  if (!status.initialized) {
    console.error('❌ Gemini API failed to initialize');
    console.log('Error:', status.error);
    return false;
  }
  
  // Test actual API call
  try {
    console.log('🧪 Testing API call...');
    const result = await interpretWithGemini('list all files');
    console.log('✅ API call successful:', result);
    
    if (result.confidence < 0.7) {
      console.warn('⚠️ Low confidence result - falling back to pattern matching');
    }
    
    return true;
  } catch (error) {
    console.error('❌ API call failed:', error);
    return false;
  }
};

export const setupGeminiInstructions = () => {
  return `
🚀 Gemini API Setup Instructions:

1. Get API Key:
   • Visit: https://makersuite.google.com/app/apikey
   • Sign in with your Google account
   • Click "Create API Key"
   • Copy the generated key

2. Configure Environment:
   • Create a .env file in the project root (same level as package.json)
   • Add: VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
   • Replace "your_actual_api_key_here" with your real API key

3. Restart Development Server:
   • Stop the current dev server (Ctrl+C)
   • Restart with: npm run dev or yarn dev

4. Test the Setup:
   • Open browser console
   • Run: testGeminiAPI()
   • Should show "✅ API call successful"

Common Issues:
• Make sure the .env file is in the correct location
• Ensure the key starts with "AIza..." (Gemini API keys)
• Restart the server after creating .env
• Check that the key has no extra spaces or quotes
`;
};

// Auto-run test in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('💡 Gemini API helper loaded. Run testGeminiAPI() to test your setup.');
  console.log('💡 Run setupGeminiInstructions() for setup help.');
}
