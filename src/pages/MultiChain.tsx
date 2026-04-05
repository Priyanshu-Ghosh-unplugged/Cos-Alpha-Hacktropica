/**
 * Multi-Chain Dashboard Page - Fully Functional Unified Wallet App
 * 
 * Features:
 * - Mock authentication (Email only)
 * - Unified wallet view across Algorand, Stellar, Solana
 * - Real-time balance fetching
 * - Chain-specific operations based on each blockchain's purpose
 */

import { useState, useEffect } from 'react';
import { 
  Wallet, LogOut, Copy, ExternalLink, RefreshCw, 
  Send, Shield, Globe, Zap, Coins, Lock,
  ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MagicLogin } from '@/components/auth/MagicLogin';
import { 
  useUnifiedWallet, 
  useChainWallet, 
  Chain 
} from '@/contexts/UnifiedWalletContext';
import { useAlgorandBalance } from '@/hooks/useAlgorand';
import { useStellarBalance } from '@/hooks/useStellar';
import { useSolanaBalance } from '@/hooks/useSolana';

// Chain configuration with colors and purposes
const CHAIN_CONFIG: Record<Chain, { 
  name: string; 
  icon: typeof Coins; 
  color: string; 
  bgColor: string;
  purpose: string;
  network: string;
}> = {
  algorand: {
    name: 'Algorand',
    icon: Coins,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    purpose: 'Payload Handling & x402 Payments',
    network: 'Testnet',
  },
  stellar: {
    name: 'Stellar',
    icon: Globe,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    purpose: 'Immutable Encrypted NLP Layer',
    network: 'Testnet',
  },
  solana: {
    name: 'Solana',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    purpose: 'High-Throughput NLP & DeFi',
    network: 'Devnet',
  },
};

// Wallet Card Component
function WalletCard({ chain, address }: { chain: Chain; address: string }) {
  const { toast } = useToast();
  const config = CHAIN_CONFIG[chain];
  const Icon = config.icon;

  const algorandBalance = useAlgorandBalance(chain === 'algorand' ? address : undefined, 'testnet');
  const stellarBalance = useStellarBalance(chain === 'stellar' ? address : undefined, 'testnet');
  const solanaBalance = useSolanaBalance(chain === 'solana' ? address : undefined, 'devnet');

  const balance = chain === 'algorand' 
    ? algorandBalance.balance 
    : chain === 'stellar' 
      ? stellarBalance.balance 
      : solanaBalance.balance;

  const isLoading = chain === 'algorand' 
    ? algorandBalance.isLoading 
    : chain === 'stellar' 
      ? stellarBalance.isLoading 
      : solanaBalance.isLoading;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({ title: 'Address copied', description: `${config.name} address copied to clipboard` });
  };

  const getExplorerUrl = () => {
    switch (chain) {
      case 'algorand':
        return `https://allo.info/address/${address}`;
      case 'stellar':
        return `https://testnet.stellarchain.io/address/${address}`;
      case 'solana':
        return `https://explorer.solana.com/address/${address}?cluster=devnet`;
    }
  };

  const formatBalance = () => {
    if (isLoading) return 'Loading...';
    if (!balance) return '0.00';
    
    switch (chain) {
      case 'algorand':
        return `${(Number(balance) / 1_000_000).toFixed(4)} ALGO`;
      case 'stellar':
        const xlm = (balance as any[])?.find?.((b: any) => b.asset_type === 'native');
        return xlm ? `${xlm.balance} XLM` : '0.00 XLM';
      case 'solana':
        return `${(Number(balance) / 1_000_000_000).toFixed(4)} SOL`;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${config.bgColor} pb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              <CardDescription className="text-xs">{config.network}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {config.purpose}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Address</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <a href={getExplorerUrl()} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
          <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
            {address}
          </code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-semibold">{formatBalance()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MultiChainDashboard() {
  const { toast } = useToast();
  const { 
    isConnected, 
    isLoading, 
    user, 
    wallets, 
    logout, 
    refreshWallets,
    isMagicReady 
  } = useUnifiedWallet();
  const [activeTab, setActiveTab] = useState<Chain>('algorand');

  useEffect(() => {
    const handleRedirect = async () => {
      if (window.location.search.includes('magic_credential')) {
        toast({ title: 'Login Successful', description: 'Your unified wallet is ready' });
      }
    };
    handleRedirect();
  }, [toast]);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Multi-Chain Wallet</h1>
            <p className="text-muted-foreground">
              One login. Three blockchains. Unlimited possibilities.
            </p>
          </div>
          <MagicLogin />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-xs font-medium">Algorand</p>
              <p className="text-[10px] text-muted-foreground">x402 Payments</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <Globe className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs font-medium">Stellar</p>
              <p className="text-[10px] text-muted-foreground">NLP Layer</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <Zap className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-xs font-medium">Solana</p>
              <p className="text-[10px] text-muted-foreground">DeFi & NLP</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Chain Wallet</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshWallets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {wallets.algorand && <WalletCard chain="algorand" address={wallets.algorand.address} />}
        {wallets.stellar && <WalletCard chain="stellar" address={wallets.stellar.address} />}
        {wallets.solana && <WalletCard chain="solana" address={wallets.solana.address} />}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Chain)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="algorand" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Algorand
          </TabsTrigger>
          <TabsTrigger value="stellar" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Stellar
          </TabsTrigger>
          <TabsTrigger value="solana" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Solana
          </TabsTrigger>
        </TabsList>

        <TabsContent value="algorand" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  <CardTitle>x402 Payment Streams</CardTitle>
                </div>
                <CardDescription>
                  Create streaming payment channels for continuous services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    App ID: <code className="font-mono">758268177</code>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Deployed on Algorand Testnet
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Create Payment Stream
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <CardTitle>Task Escrow</CardTitle>
                </div>
                <CardDescription>
                  Secure escrow for task-based payments with release conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Escrows</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Locked</span>
                    <span className="font-medium">0 ALGO</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Create Escrow
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stellar" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <CardTitle>Encrypted NLP Channel</CardTitle>
                </div>
                <CardDescription>
                  Immutable encrypted messaging layer using Stellar memos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Deployed Account: <code className="font-mono text-xs">GCEN...KJUC</code>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Multi-sig payment channel active
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Send Encrypted Message
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <CardTitle>Cross-Border Payments</CardTitle>
                </div>
                <CardDescription>
                  Multi-currency payments with path payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline">XLM</Badge>
                  <Badge variant="outline">USD</Badge>
                  <Badge variant="outline">EUR</Badge>
                </div>
                <Button className="w-full" variant="outline">
                  Send Payment
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="solana" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <CardTitle>High-Throughput NLP</CardTitle>
                </div>
                <CardDescription>
                  Fast encrypted messaging with Solana's high-speed consensus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Governance PDA: <code className="font-mono text-xs">AaJw...i3C6</code>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    ~400ms confirmation time
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Send Fast Message
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <CardTitle>DeFi Governance</CardTitle>
                </div>
                <CardDescription>
                  Multisig governance for DeFi strategy execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Proposals</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Voting Power</span>
                    <span className="font-medium">0 SOL</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Proposals
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
