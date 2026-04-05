/**
 * MockLogin Component
 * 
 * Provides mock email login for demo purposes.
 */

import { useState } from 'react';
import { Mail, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext';

export function MagicLogin() {
  const { login, isLoading, error, isMockAuth } = useUnifiedWallet();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await login('email', { email: email.trim() });
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mock Mode Badge */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            Demo Mode: No external authentication required
          </AlertDescription>
        </Alert>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isSubmitting}
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting || !email.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
