/**
 * Stellar Wallet Manager Component
 */

import { useState } from 'react';
import { Copy, Eye, EyeOff, Plus, Wallet, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStellarWallets, useStellarBalance } from '@/hooks/useStellar';
import type { StellarNetwork } from '@/lib/stellar/types';

export function StellarWalletManager() {
  const { wallets, activeWallet, create, import: importWallet, setActive, remove } = useStellarWallets();
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [importSecret, setImportSecret] = useState('');
  const [network, setNetwork] = useState<StellarNetwork>('testnet');

  const handleCreate = () => {
    if (!newWalletName.trim()) return;
    const { secret } = create(newWalletName, network, false);
    setShowSecret(secret);
    setNewWalletName('');
  };

  const handleImport = () => {
    if (!newWalletName.trim() || !importSecret.trim()) return;
    importWallet(newWalletName, importSecret, network, false);
    setNewWalletName('');
    setImportSecret('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Stellar Wallets
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stellar Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={network} onValueChange={(v) => setNetwork(v as StellarNetwork)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testnet">Testnet</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="futurenet">Futurenet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wallet Name</Label>
                <Input
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="My Wallet"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key (for import)</Label>
                <Input
                  value={importSecret}
                  onChange={(e) => setImportSecret(e.target.value)}
                  placeholder="S... (optional)"
                  type="password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1">
                  Create New
                </Button>
                <Button onClick={handleImport} variant="outline" className="flex-1" disabled={!importSecret}>
                  Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallets.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No wallets yet. Create or import one.</p>
        ) : (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isActive={wallet.id === activeWallet?.id}
              onActivate={() => setActive(wallet.id)}
              onDelete={() => remove(wallet.id)}
            />
          ))
        )}

        {showSecret && (
          <Dialog open onOpenChange={() => setShowSecret(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Your Secret Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  This is your secret key. Save it securely - it won't be shown again!
                </p>
                <div className="flex items-center gap-2">
                  <Input value={showSecret} readOnly type="password" className="font-mono" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(showSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setShowSecret(null)} className="w-full">
                  I've Saved It
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function WalletCard({
  wallet,
  isActive,
  onActivate,
  onDelete,
}: {
  wallet: { id: string; name: string; publicKey: string; network: string };
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const { balance, isLoading, refresh } = useStellarBalance(wallet.publicKey, wallet.network as StellarNetwork);

  return (
    <div className={`p-4 rounded-lg border ${isActive ? 'border-primary' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{wallet.name}</span>
          <Badge variant="outline">{wallet.network}</Badge>
          {isActive && <Badge>Active</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground font-mono truncate mb-2">
        {wallet.publicKey}
      </div>
      {balance && (
        <div className="space-y-1">
          {balance.map((b, i) => (
            <div key={i} className="text-sm">
              {Number(b.balance).toLocaleString()} {b.asset.code}
            </div>
          ))}
        </div>
      )}
      {!isActive && (
        <Button variant="outline" size="sm" onClick={onActivate} className="mt-2 w-full">
          Set Active
        </Button>
      )}
    </div>
  );
}
