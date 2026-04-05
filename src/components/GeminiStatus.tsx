/**
 * Gemini API Status Component
 * Shows current API status and provides setup help
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getGeminiStatus } from '@/lib/geminiInterpreter';
import { interpretWithGemini } from '@/lib/geminiInterpreter';
import { 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GeminiStatus() {
  const [status, setStatus] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setStatus(getGeminiStatus());
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await interpretWithGemini('list all files');
      
      if (result.confidence >= 0.7) {
        setTestResult(`✅ Success! Command: ${result.command} ${result.args.join(' ')} (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        toast({ title: 'Gemini API Working', description: 'API test successful!' });
      } else if (result.confidence > 0) {
        setTestResult(`⚠️ Partial Success: Using fallback pattern matching (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        toast({ title: 'Fallback Active', description: 'Using pattern matching' });
      } else {
        setTestResult('❌ API Not Working: Check configuration');
        toast({ title: 'API Error', description: 'Gemini API not configured', variant: 'destructive' });
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({ title: 'Test Failed', description: 'Could not test API', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Gemini API Status</CardTitle>
            </div>
            <Badge variant={status.configured ? "default" : "destructive"}>
              {status.configured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
          <CardDescription>
            Natural language to Linux command interpretation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.configured ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">API key is configured</span>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Gemini API key not configured</strong></p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Get API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></li>
                    <li>Create <code>.env</code> file in project root</li>
                    <li>Add: <code>VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here</code></li>
                    <li>Restart development server</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {status.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={testing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test API'}
            </Button>
            <Button variant="outline" asChild>
              <a href="/GEMINI_SETUP.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Setup Guide
              </a>
            </Button>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription className="font-mono text-sm">
                {testResult}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {status.setupInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
              {status.setupInstructions}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
