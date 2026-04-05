// Gemini API Integration Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interpretWithGemini, GeminiInterpreter } from '../lib/geminiInterpreter';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

describe('Gemini Interpreter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('interpretWithGemini', () => {
    it('should return fallback result when API key is not configured', async () => {
      // Mock environment variable to be undefined
      const originalEnv = import.meta.env;
      vi.stubGlobal('import.meta', {
        env: {
          ...originalEnv,
          VITE_GOOGLE_GEMINI_API_KEY: undefined
        }
      });

      const result = await interpretWithGemini('list files');
      
      expect(result.command).toBe('echo');
      expect(result.confidence).toBe(0);
      expect(result.explanation).toBe('API not configured');
    });

    it('should return fallback result when API key is placeholder', async () => {
      vi.stubGlobal('import.meta', {
        env: {
          VITE_GOOGLE_GEMINI_API_KEY: 'your_gemini_api_key_here'
        }
      });

      const result = await interpretWithGemini('list files');
      
      expect(result.command).toBe('echo');
      expect(result.confidence).toBe(0);
      expect(result.explanation).toBe('API not configured');
    });
  });

  describe('GeminiInterpreter class', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new GeminiInterpreter('')).toThrow('Google Gemini API key is required');
      expect(() => new GeminiInterpreter('your_gemini_api_key_here')).not.toThrow();
    });

    it('should handle successful API response', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(JSON.stringify({
            command: 'ls',
            args: ['.'],
            flags: ['-la'],
            confidence: 0.95,
            explanation: 'List all files in long format'
          }))
        }
      };

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const interpreter = new GeminiInterpreter('test-api-key');
      const result = await interpreter.interpretHumanLanguage('show all files');

      expect(result.command).toBe('ls');
      expect(result.args).toEqual(['.']);
      expect(result.flags).toEqual(['-la']);
      expect(result.confidence).toBe(0.95);
      expect(result.explanation).toBe('List all files in long format');
    });

    it('should handle malformed API response', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue('Invalid JSON response')
        }
      };

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const interpreter = new GeminiInterpreter('test-api-key');
      const result = await interpreter.interpretHumanLanguage('show all files');

      // Should fall back to basic parsing
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle API errors gracefully', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const interpreter = new GeminiInterpreter('test-api-key');
      const result = await interpreter.interpretHumanLanguage('show all files');

      // Should fall back to basic parsing
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should provide fallback parsing for common commands', async () => {
      const interpreter = new GeminiInterpreter('test-api-key');
      
      // Mock API failure
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const listResult = await interpreter.interpretHumanLanguage('list all files including hidden');
      expect(listResult.command).toBe('ls');
      expect(listResult.flags).toContain('-a');

      const createResult = await interpreter.interpretHumanLanguage('create a folder called test');
      expect(createResult.command).toBe('mkdir');
      expect(createResult.args).toContain('new_folder');

      const removeResult = await interpreter.interpretHumanLanguage('delete file.txt');
      expect(removeResult.command).toBe('rm');
      expect(removeResult.args).toContain('file');
    });
  });

  describe('testConnection', () => {
    it('should return false when API fails', async () => {
      const interpreter = new GeminiInterpreter('test-api-key');
      
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Connection failed'));
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const result = await interpreter.testConnection();
      expect(result).toBe(false);
    });

    it('should return true when API succeeds', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue(JSON.stringify({
            command: 'ls',
            args: ['.'],
            flags: [],
            confidence: 0.9,
            explanation: 'List files'
          }))
        }
      };

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      
      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent
        })
      }));

      const interpreter = new GeminiInterpreter('test-api-key');
      const result = await interpreter.testConnection();
      expect(result).toBe(true);
    });
  });
});
