/**
 * Algorand Wallet Manager Component
 * 
 * UI for managing Algorand wallets - create, import, select, and view wallets.
 */

import { useState } from 'react';
import { Wallet, Plus, Import, Trash2, Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandWallets, useAlgorandBalance } from '@/hooks/useAlgorand';
import type { AlgorandNetwork } from '@/lib/algorand/types';

const NETWORKS: { value: AlgorandNetwork; label: string; color: string }[] = [
  { value: 'testnet', label: 'Testnet', color: 'bg-yellow-500' },
  { value: 'mainnet', label: 'Mainnet', color: 'bg-green-500' },
  { value: 'betanet', label: 'Betanet', color: 'bg-blue-500' },
  { value: 'localnet', label: 'Localnet', color: 'bg-gray-500' },
];

export function AlgorandWalletManager() {
  const { toast } = useToast();
  const { wallets, activeWallet, isLoading, create, import: importWallet, remove, setActive } = useAlgorandWallets();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletNetwork, setNewWalletNetwork] = useState<AlgorandNetwork>('testnet');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importWalletName, setImportWalletName] = useState('');
  const [importNetwork, setImportNetwork] = useState<AlgorandNetwork>('testnet');
  const [createdMnemonic, setCreatedMnemonic] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newWalletName.trim()) {
      toast({ title: 'Error', description: 'Please enter a wallet name', variant: 'destructive' });
      return;
    }
    
    const result = await create(newWalletName, newWalletNetwork, false);
    
    if (result) {
      setCreatedMnemonic(result.mnemonic);
      toast({ 
        title: 'Wallet Created', 
        description: `Wallet "${result.wallet.name}" created on ${result.wallet.network}` 
      });
      setNewWalletName('');
    } else {
      toast({ title: 'Error', description: 'Failed to create wallet', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!importWalletName.trim() || !importMnemonic.trim()) {
      toast({ title: 'Error', description: 'Please enter wallet name and mnemonic', variant: 'destructive' });
      return;
    }
    
    const result = await importWallet(importWalletName, importMnemonic, importNetwork, false);
    
    if (result) {
      toast({ 
        title: 'Wallet Imported', 
        description: `Wallet "${result.name}" imported successfully` 
      });
      setImportMnemonic('');
      setImportWalletName('');
      setImportOpen(false);
    } else {
      toast({ title: 'Error', description: 'Failed to import wallet', variant: 'destructive' });
    }
  };

  const handleDelete = async (walletId: string) => {
    const success = await remove(walletId);
    if (success) {
      toast({ title: 'Wallet Deleted', description: 'Wallet removed successfully' });
    } else {
      toast({ title: 'Error', description: 'Failed to delete wallet', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const getExplorerUrl = (address: string, network: AlgorandNetwork) => {
    const baseUrls: Record<AlgorandNetwork, string> = {
      mainnet: 'https://explorer.perawallet.app',
      testnet: 'https://testnet.explorer.perawallet.app',
      betanet: 'https://betanet.explorer.perawallet.app',
      localnet: '',
    };
    return `${baseUrls[network]}/address/${address}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Algorand Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Algorand Wallets
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Import className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Wallet</DialogTitle>
                  <DialogDescription>
                    Import an existing wallet using your 25-word mnemonic phrase.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Wallet Name</Label>
                    <Input 
                      value={importWalletName} 
                      onChange={(e) => setImportWalletName(e.target.value)}
                      placeholder="My Wallet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mnemonic</Label>
                    <Input 
                      value={importMnemonic} 
                      onChange={(e) => setImportMnemonic(e.target.value)}
                      placeholder="word1 word2 word3 ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select value={importNetwork} onValueChange={(v) => setImportNetwork(v as AlgorandNetwork)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NETWORKS.map(n => (
                          <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button onClick={handleImport}>Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                  <DialogDescription>
                    Create a new Algorand wallet. Make sure to save your mnemonic securely.
                  </DialogDescription>
                </DialogHeader>
                
                {!createdMnemonic ? (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Wallet Name</Label>
                        <Input 
                          value={newWalletName} 
                          onChange={(e) => setNewWalletName(e.target.value)}
                          placeholder="My New Wallet"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Network</Label>
                        <Select value={newWalletNetwork} onValueChange={(v) => setNewWalletNetwork(v as AlgorandNetwork)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NETWORKS.map(n => (
                              <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreate}>Create Wallet</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 font-medium mb-2">Save this mnemonic securely!</p>
                        <p className="text-xs text-yellow-700 mb-4">
                          This is the only way to recover your wallet. Never share it with anyone.
                        </p>
                        <code className="block p-3 bg-black text-white text-xs rounded break-all">
                          {createdMnemonic}
                        </code>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => copyToClipboard(createdMnemonic)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button onClick={() => { setCreatedMnemonic(null); setCreateOpen(false); }}>
                        I've Saved It
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Manage your Algorand wallets for payments and on-chain operations
        </CardDescription>
      </CardHeader>

      <CardContent>
        {wallets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No wallets yet. Create or import a wallet to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <WalletItem 
                key={wallet.id} 
                wallet={wallet} 
                isActive={wallet.id === activeWallet?.id}
                onActivate={() => setActive(wallet.id)}
                onDelete={() => handleDelete(wallet.id)}
                getExplorerUrl={getExplorerUrl}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WalletItem({ 
  wallet, 
  isActive, 
  onActivate, 
  onDelete,
  getExplorerUrl,
  copyToClipboard
}: {
  wallet: { id: string; name: string; address: string; network: AlgorandNetwork };
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
  getExplorerUrl: (address: string, network: AlgorandNetwork) => string;
  copyToClipboard: (text: string) => void;
}) {
  const networkColor = NETWORKS.find(n => n.value === wallet.network)?.color || 'bg-gray-500';
  const { balance } = useAlgorandBalance(wallet.id, wallet.network, false);

  return (
    <div className={`p-4 rounded-lg border ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${networkColor}`} />
          <div>
            <div className="font-medium flex items-center gap-2">
              {wallet.name}
              {isActive && <Badge variant="default" className="text-xs">Active</Badge>}
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {balance ? balance.algoBalanceFormatted : 'Loading...'}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(wallet.address)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => window.open(getExplorerUrl(wallet.address, wallet.network), '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {!isActive && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onActivate}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          {!isActive && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
