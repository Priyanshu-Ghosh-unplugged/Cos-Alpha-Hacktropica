/**
 * Algorand Payment Dialog Component
 * 
 * UI for sending payments (ALGO or ASA).
 */

import { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandPayment, useAlgorandWallets, useAlgorandBalance, useAlgorandBudget } from '@/hooks/useAlgorand';
import { isValidAddress } from '@/lib/algorand';

export function AlgorandPaymentDialog() {
  const { toast } = useToast();
  const { activeWallet } = useAlgorandWallets();
  const { balance } = useAlgorandBalance(activeWallet?.id, activeWallet?.network, false);
  const { check } = useAlgorandBudget();
  const { send, isLoading, lastResult } = useAlgorandPayment(activeWallet?.id, activeWallet?.network);
  
  const [open, setOpen] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [assetId, setAssetId] = useState('0');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form');

  const availableAssets = balance?.assets || [{ id: 0, name: 'Algorand', unitName: 'ALGO', amount: BigInt(0) }];

  const validate = () => {
    if (!toAddress.trim()) return 'Enter recipient address';
    if (!isValidAddress(toAddress)) return 'Invalid Algorand address';
    if (!amount.trim() || parseFloat(amount) <= 0) return 'Enter valid amount';
    if (!activeWallet) return 'No active wallet';
    return null;
  };

  const handleContinue = () => {
    const error = validate();
    if (error) {
      toast({ title: 'Validation Error', description: error, variant: 'destructive' });
      return;
    }

    // Check budget
    const amountMicro = BigInt(Math.round(parseFloat(amount) * 1000000));
    const budgetCheck = check(amountMicro);
    
    if (!budgetCheck.allowed) {
      toast({ 
        title: 'Budget Limit', 
        description: budgetCheck.reason || 'Transaction exceeds budget', 
        variant: 'destructive' 
      });
      return;
    }

    setStep('confirm');
  };

  const handleSend = async () => {
    const amountMicro = BigInt(Math.round(parseFloat(amount) * 1000000));
    const result = await send(toAddress, amountMicro, parseInt(assetId), note || undefined);
    
    setStep('result');
    
    if (result.success) {
      toast({ 
        title: 'Payment Sent', 
        description: `Transaction ${result.txId.slice(0, 8)}... confirmed` 
      });
    } else {
      toast({ 
        title: 'Payment Failed', 
        description: result.error || 'Unknown error', 
        variant: 'destructive' 
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('form');
    setToAddress('');
    setAmount('');
    setAssetId('0');
    setNote('');
  };

  const selectedAsset = availableAssets.find(a => a.id === parseInt(assetId));
  const hasInsufficientBalance = selectedAsset && parseFloat(amount) > Number(selectedAsset.amount) / 1000000;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Send Payment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle>Send Payment</DialogTitle>
              <DialogDescription>
                Send ALGO or ASA to another Algorand address.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>From</Label>
                <div className="p-3 rounded-md bg-muted text-sm">
                  {activeWallet ? (
                    <>
                      <div className="font-medium">{activeWallet.name}</div>
                      <div className="text-muted-foreground font-mono">
                        {activeWallet.address.slice(0, 12)}...{activeWallet.address.slice(-8)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Balance: {balance?.algoBalanceFormatted || 'Loading...'}
                      </div>
                    </>
                  ) : (
                    <span className="text-destructive">No active wallet</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>To Address</Label>
                <Input 
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Enter Algorand address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select value={assetId} onValueChange={setAssetId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} ({asset.unitName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input 
                    type="number"
                    step="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Amount in ${selectedAsset?.unitName || 'ALGO'}`}
                  />
                </div>
              </div>

              {hasInsufficientBalance && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You have {selectedAsset ? Number(selectedAsset.amount) / 1000000 : 0} {selectedAsset?.unitName}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Transaction note"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleContinue}
                disabled={!activeWallet || hasInsufficientBalance}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Please review the payment details before confirming.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-mono">{activeWallet?.address.slice(0, 8)}...{activeWallet?.address.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono">{toAddress.slice(0, 8)}...{toAddress.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{amount} {selectedAsset?.unitName}</span>
                </div>
                {note && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Note</span>
                    <span className="text-sm">{note}</span>
                  </div>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  This transaction will be submitted to the {activeWallet?.network} network and cannot be reversed.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('form')}>Back</Button>
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'result' && lastResult && (
          <>
            <DialogHeader>
              <DialogTitle>{lastResult.success ? 'Payment Successful' : 'Payment Failed'}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {lastResult.success ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 text-center">
                    <div className="text-4xl mb-2">✓</div>
                    <div className="font-medium text-green-800">Transaction Confirmed</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono">{lastResult.txId.slice(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed Round</span>
                      <span>{lastResult.confirmedRound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span>{lastResult.amount.toString()} microALGO</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-50 text-center">
                    <div className="text-4xl mb-2">✗</div>
                    <div className="font-medium text-red-800">Transaction Failed</div>
                  </div>
                  <Alert variant="destructive">
                    <AlertDescription>{lastResult.error || 'Unknown error occurred'}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
