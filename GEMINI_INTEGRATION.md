# Google Gemini API Integration

This document describes the integration of Google Gemini API for intelligent human language to Linux command interpretation in the Cos Alpha terminal.

## Overview

The Cos Alpha terminal now uses Google Gemini AI to understand natural language commands and convert them into valid Linux commands. This provides a more intuitive and intelligent user experience.

## Features

### 🤖 Intelligent Command Interpretation
- Converts natural language to Linux commands using Google Gemini AI
- Handles complex commands with appropriate flags and arguments
- Provides confidence scores for each interpretation
- Includes explanations for generated commands

### 🔄 Fallback System
- Gracefully falls back to pattern-based matching if Gemini API is unavailable
- Maintains full functionality even without internet connection
- Provides basic keyword-based parsing as last resort

### ⚡ Real-time Processing
- Async processing with loading indicators
- Error handling and user feedback
- Maintains terminal responsiveness

## Setup

### 1. Environment Configuration

Add your Google Gemini API key to the `.env` file:

```bash
# Google Gemini API Key for human language to Linux command interpretation
GOOGLE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Get API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file

### 3. Install Dependencies

The required packages are already installed:

```bash
npm install @google/generative-ai
```

## Usage

### Basic Commands

Try these natural language commands:

```bash
# File operations
"show me all files including hidden ones"
"create a folder called myproject"
"remove file.txt forcefully"
"copy file1.txt to backup/"

# Navigation
"go to the documents folder"
"show current directory"
"go back one level"

# System information
"show system information"
"display disk usage"
"list running processes"

# Search
"find all python files"
"search for 'function' in app.js"
```

### Advanced Commands

The AI can handle more complex requests:

```bash
"create a backup of all .txt files in a compressed archive"
"show me the 10 largest files in the current directory"
"find all files modified in the last 7 days"
```

## Architecture

### Components

1. **GeminiInterpreter** (`src/lib/geminiInterpreter.ts`)
   - Main class for Gemini API integration
   - Handles API communication and response parsing
   - Provides fallback parsing methods

2. **Human Language Interpreter** (`src/lib/humanLanguageInterpreter.ts`)
   - Updated to use Gemini API as primary interpreter
   - Falls back to pattern matching when needed
   - Maintains backward compatibility

3. **Terminal Component** (`src/components/Terminal.tsx`)
   - Updated to handle async command processing
   - Shows loading indicators during API calls
   - Provides error feedback

### Flow

```
User Input → Gemini API → Parse Response → Validate Command → Execute
     ↓              ↓            ↓              ↓           ↓
  Loading →    AI Processing → Confidence Check → Command → Output
     ↓              ↓            ↓              ↓           ↓
  Fallback ←   API Failure ← Low Confidence ← Invalid ← Error
```

## API Response Format

Gemini API returns responses in this JSON format:

```json
{
  "command": "ls",
  "args": ["."],
  "flags": ["-la"],
  "confidence": 0.95,
  "explanation": "List all files including hidden ones in long format"
}
```

### Confidence Levels

- **0.7+**: High confidence - use directly
- **0.3-0.7**: Medium confidence - validate command exists
- **<0.3**: Low confidence - fall back to pattern matching

## Error Handling

### API Errors
- Network failures
- Invalid API keys
- Rate limiting
- Service unavailable

All errors are caught and handled gracefully with fallback to pattern matching.

### Invalid Responses
- Malformed JSON
- Missing required fields
- Invalid command names

The system validates responses and falls back when needed.

## Testing

### Unit Tests

Run the test suite:

```bash
npm test
```

The tests cover:
- API configuration
- Response parsing
- Error handling
- Fallback mechanisms

### Manual Testing

Use the built-in test function:

```javascript
// In browser console
testGeminiIntegration()
```

This tests:
- API connection
- Various command interpretations
- Error scenarios

## Performance Considerations

### Caching
- Commands are not cached to ensure fresh interpretations
- Consider adding caching for frequently used commands

### Rate Limits
- Gemini API has rate limits
- Implement exponential backoff for production use
- Consider user-level rate limiting

### Optimization
- Batch multiple commands when possible
- Use streaming responses for long operations
- Implement request debouncing

## Security

### API Key Protection
- API key is stored in environment variables
- Never expose API key in client-side code
- Use server-side proxy for production if needed

### Input Validation
- All user inputs are sanitized
- Command injection prevention
- File system access controls

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correct
   - Check if the key has proper permissions
   - Ensure the key is not expired

2. **Commands Not Working**
   - Check network connection
   - Verify API quota is not exceeded
   - Check browser console for errors

3. **Fallback Not Working**
   - Ensure pattern matching is enabled
   - Check command registry is loaded
   - Verify command aliases are configured

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

This will show:
- API requests and responses
- Fallback triggers
- Confidence scores
- Error details

## Future Enhancements

### Planned Features
- [ ] Command learning from user feedback
- [ ] Context-aware command suggestions
- [ ] Multi-step command sequences
- [ ] Voice input support
- [ ] Custom command aliases
- [ ] Command history analysis

### API Improvements
- [ ] Streaming responses
- [ ] Batch processing
- [ ] Custom model fine-tuning
- [ ] Local model integration

## Contributing

To contribute to the Gemini integration:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

This integration follows the same license as the main project.

## Support

For issues or questions:
- Check the troubleshooting section
- Review the test cases for examples
- Open an issue on the repository
- Check the Google Gemini API documentation
