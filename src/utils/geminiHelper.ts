// Utility functions for Gemini API integration

import { interpretWithGemini, getGeminiInterpreter } from '@/lib/geminiInterpreter';

export interface GeminiTestResult {
  input: string;
  output: string;
  confidence: number;
  explanation?: string;
  success: boolean;
  error?: string;
}

/**
 * Test multiple commands with Gemini API
 */
export const testMultipleCommands = async (commands: string[]): Promise<GeminiTestResult[]> => {
  const results: GeminiTestResult[] = [];
  
  for (const command of commands) {
    try {
      const result = await interpretWithGemini(command);
      results.push({
        input: command,
        output: `${result.command} ${result.args.join(' ')} ${result.flags?.join(' ') || ''}`.trim(),
        confidence: result.confidence,
        explanation: result.explanation,
        success: true
      });
    } catch (error) {
      results.push({
        input: command,
        output: '',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
};

/**
 * Get Gemini API status
 */
export const getGeminiStatus = () => {
  const interpreter = getGeminiInterpreter();
  
  return {
    configured: !!interpreter,
    apiKeySet: !!(import.meta.env.VITE_GOOGLE_GEMINI_API_KEY && 
                   import.meta.env.VITE_GOOGLE_GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    model: 'gemini-2.5-flash',
    features: [
      'Natural language to Linux command conversion',
      'Confidence scoring',
      'Fallback to pattern matching',
      'Error handling',
      'Async processing'
    ]
  };
};

/**
 * Format confidence score for display
 */
export const formatConfidence = (confidence: number): string => {
  if (confidence >= 0.8) return '🟢 High';
  if (confidence >= 0.5) return '🟡 Medium';
  if (confidence >= 0.3) return '🟠 Low';
  return '🔴 Very Low';
};

/**
 * Get example commands for testing
 */
export const getExampleCommands = () => [
  'list all files including hidden ones',
  'create a folder called myproject',
  'remove file.txt forcefully',
  'show me the current directory',
  'copy file1.txt to backup/',
  'find all python files',
  'show system information',
  'display disk usage',
  'go to home directory',
  'make file.txt executable'
];

/**
 * Validate API key format
 */
export const validateApiKey = (apiKey: string): { valid: boolean; message: string } => {
  if (!apiKey) {
    return { valid: false, message: 'API key is required' };
  }
  
  if (apiKey === 'your_gemini_api_key_here') {
    return { valid: false, message: 'Please replace with your actual Gemini API key' };
  }
  
  if (apiKey.length < 20) {
    return { valid: false, message: 'API key appears to be too short' };
  }
  
  return { valid: true, message: 'API key format looks valid' };
};
