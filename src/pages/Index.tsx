import { Terminal } from '@/components/Terminal';
import { MagicLogin } from '@/components/auth/MagicLogin';
import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';

const Index = () => {
  const { isConnected, isLoading } = useUnifiedWallet();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected - show login ONLY (no blockchain info)
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">cos α</h1>
            <p className="text-muted-foreground">
              Human-Language Operating System
            </p>
          </div>

          {/* Login Card */}
          <MagicLogin />

          {/* Minimal footer */}
          <p className="text-center text-xs text-muted-foreground">
            Demo Mode - No external authentication required
          </p>
        </div>
      </div>
    );
  }

  // Connected - show Terminal
  return (
    <div className="space-y-8">
      <Terminal />
    </div>
  );
};

export default Index;
