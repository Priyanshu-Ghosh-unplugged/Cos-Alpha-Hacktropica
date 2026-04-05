// Test script for Gemini API integration
// This can be run in the browser console to test the integration

import { interpretWithGemini, getGeminiInterpreter } from './geminiInterpreter';

export const testGeminiIntegration = async () => {
  console.log('🧪 Testing Gemini API Integration...');

  // Test 1: Check if API is configured
  const interpreter = getGeminiInterpreter();
  if (!interpreter) {
    console.log('❌ Gemini API not configured. Please set VITE_GOOGLE_GEMINI_API_KEY in .env file');
    return false;
  }

  console.log('✅ Gemini API configured');

  // Test 2: Test connection
  try {
    const connectionTest = await interpreter.testConnection();
    if (connectionTest) {
      console.log('✅ Gemini API connection successful');
    } else {
      console.log('❌ Gemini API connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API connection error:', error);
    return false;
  }

  // Test 3: Test various command interpretations
  const testCommands = [
    'list all files including hidden ones',
    'create a folder called myproject',
    'remove file.txt forcefully',
    'show me the current directory',
    'copy file1.txt to file2.txt',
    'find all python files',
    'show system information'
  ];

  console.log('🔍 Testing command interpretations...');

  for (const command of testCommands) {
    try {
      console.log(`\n📝 Input: "${command}"`);
      const result = await interpretWithGemini(command);
      console.log(`⚡ Command: ${result.command} ${result.args.join(' ')} ${result.flags?.join(' ') || ''}`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      if (result.explanation) {
        console.log(`💡 Explanation: ${result.explanation}`);
      }
    } catch (error) {
      console.log(`❌ Error interpreting "${command}":`, error);
    }
  }

  console.log('\n🎉 Gemini API integration test completed!');
  return true;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testGeminiIntegration = testGeminiIntegration;
  console.log('💡 Run testGeminiIntegration() in the console to test the Gemini API');
}
