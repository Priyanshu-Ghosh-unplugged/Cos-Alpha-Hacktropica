// Gemini API Integration for Human Language to Linux Command Interpretation
// Fixed version with better error handling and status visibility

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiCommandResult {
  command: string;
  args: string[];
  flags?: string[];
  confidence: number;
  explanation?: string;
}

// Status tracking
let lastError: string | null = null;
let isInitialized = false;

export function getGeminiStatus(): { configured: boolean; error: string | null; initialized: boolean; setupInstructions?: string } {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
  const configured = !!apiKey && apiKey !== 'your_gemini_api_key_here';
  
  if (!configured) {
    return {
      configured: false,
      error: 'API key not configured',
      initialized: false,
      setupInstructions: `
🔑 Gemini API Key Missing:

1. Get API key: https://makersuite.google.com/app/apikey
2. Create .env file in project root
3. Add: VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
4. Restart development server

Current status: Using fallback pattern matching only`
    };
  }
  
  return {
    configured,
    error: lastError,
    initialized: isInitialized,
  };
}

export class GeminiInterpreter {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Google Gemini API key is required');
    }
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });
      isInitialized = true;
      lastError = null;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Failed to initialize Gemini';
      throw error;
    }
  }

  async interpretHumanLanguage(input: string): Promise<GeminiCommandResult> {
    try {
      const prompt = this.buildPrompt(input);
      console.log('[Gemini] Sending prompt:', prompt.substring(0, 100) + '...');
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;

      // Debug logging
      const candidate = response.candidates?.[0];
      if (candidate) {
        const finishReason = candidate.finishReason;
        if (finishReason && finishReason !== 'STOP') {
          console.warn(`[Gemini] finish reason: ${finishReason}`);
          lastError = `Gemini stopped: ${finishReason}`;
        }
      }

      const text = response.text();
      console.log('[Gemini] Raw response:', text.substring(0, 200));
      
      if (!text || text.trim().length === 0) {
        console.warn('[Gemini] returned empty response');
        lastError = 'Empty response from Gemini';
        return this.fallbackParsing(input);
      }

      lastError = null;
      return this.parseGeminiResponse(text, input);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown Gemini error';
      console.error('[Gemini] API Error:', lastError);
      return this.fallbackParsing(input);
    }
  }

  private buildPrompt(input: string): string {
    return `Convert this human language request into a Linux command. Return ONLY valid JSON.

Request: "${input}"

JSON format: {"command":"cmd","args":["arg1"],"flags":["-f"],"confidence":0.95,"explanation":"brief explanation"}

Rules:
- Use standard Linux commands (ls, cd, mkdir, rm, cp, mv, grep, find, cat, echo, pwd, chmod, etc.)
- Set confidence 0.0-1.0 based on how well you understand the request
- If unclear, set confidence below 0.5
- Return ONLY the JSON object, no markdown or extra text`;
  }

  private parseGeminiResponse(response: string, originalInput: string): GeminiCommandResult {
    try {
      // Strip markdown code blocks if present
      let cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Extract JSON object
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON found in response');
      }
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

      // Fix common JSON issues
      cleaned = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, '');

      const parsed = JSON.parse(cleaned);

      if (!parsed.command || !Array.isArray(parsed.args)) {
        throw new Error('Invalid response structure');
      }

      return {
        command: parsed.command,
        args: parsed.args || [],
        flags: parsed.flags || [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        explanation: parsed.explanation,
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error, 'Raw:', response);
      return this.fallbackParsing(originalInput);
    }
  }

  private fallbackParsing(input: string): GeminiCommandResult {
    const lower = input.toLowerCase().trim();

    if (lower.includes('list') || lower.includes('show') || lower.includes('ls')) {
      return {
        command: 'ls',
        args: ['.'],
        flags: lower.includes('hidden') || lower.includes('all') ? ['-la'] : [],
        confidence: 0.3,
        explanation: 'Fallback: listing files',
      };
    }

    if (lower.includes('create') && (lower.includes('folder') || lower.includes('directory'))) {
      const nameMatch = lower.match(/(?:called|named)\s+(\S+)/);
      return {
        command: 'mkdir',
        args: [nameMatch?.[1] || 'new_folder'],
        flags: [],
        confidence: 0.3,
        explanation: 'Fallback: creating folder',
      };
    }

    if (lower.includes('remove') || lower.includes('delete')) {
      return {
        command: 'rm',
        args: ['file'],
        flags: lower.includes('force') ? ['-f'] : [],
        confidence: 0.3,
        explanation: 'Fallback: removing files',
      };
    }

    if (lower.includes('current') && (lower.includes('directory') || lower.includes('dir') || lower.includes('path'))) {
      return { command: 'pwd', args: [], flags: [], confidence: 0.3, explanation: 'Fallback: print working directory' };
    }

    if (lower.includes('go') || lower.includes('navigate') || lower.includes('change dir')) {
      const dirMatch = lower.match(/(?:to|into)\s+(?:the\s+)?(\S+)/);
      return { command: 'cd', args: [dirMatch?.[1] || '~'], flags: [], confidence: 0.3, explanation: 'Fallback: change directory' };
    }

    return {
      command: 'echo',
      args: [input],
      flags: [],
      confidence: 0.1,
      explanation: 'Unable to interpret command',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.interpretHumanLanguage('list files');
      return result.confidence > 0.5;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let geminiInterpreter: GeminiInterpreter | null = null;

export function getGeminiInterpreter(): GeminiInterpreter | null {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('Google Gemini API key not configured. Set VITE_GOOGLE_GEMINI_API_KEY in your environment.');
    return null;
  }

  if (!geminiInterpreter) {
    geminiInterpreter = new GeminiInterpreter(apiKey);
  }

  return geminiInterpreter;
}

export async function interpretWithGemini(input: string): Promise<GeminiCommandResult> {
  const interpreter = getGeminiInterpreter();

  if (!interpreter) {
    return {
      command: 'echo',
      args: [`Gemini API not configured. Set VITE_GOOGLE_GEMINI_API_KEY. Input: ${input}`],
      flags: [],
      confidence: 0.0,
      explanation: 'API not configured',
    };
  }

  try {
    return await interpreter.interpretHumanLanguage(input);
  } catch (error) {
    console.error('Gemini interpretation failed:', error);
    return {
      command: 'echo',
      args: [`Gemini error: ${error instanceof Error ? error.message : 'Unknown'}. Input: ${input}`],
      flags: [],
      confidence: 0.0,
      explanation: 'API error occurred',
    };
  }
}