/**
 * Algorand Dashboard Component
 * 
 * Main dashboard combining all Algorand features.
 */

import { useState } from 'react';
import { Coins, Shield, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlgorandWalletManager, AlgorandBudgetDashboard, AlgorandActivityLog, AlgorandPaymentDialog } from '@/components/algorand';
import { useAlgorandWallets, useAlgorandBalance } from '@/hooks/useAlgorand';

export function AlgorandDashboard() {
  const { activeWallet } = useAlgorandWallets();
  const { balance, isLoading: balanceLoading } = useAlgorandBalance(
    activeWallet?.id,
    activeWallet?.network,
    true,
    30000
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Algorand Integration</h1>
          <p className="text-muted-foreground">
            Manage wallets, payments, and on-chain operations
          </p>
        </div>
        {balance && (
          <Card className="w-auto">
            <CardContent className="flex items-center gap-4 py-4">
              <Coins className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Active Wallet Balance</div>
                <div className="text-xl font-bold">{balance.algoBalanceFormatted}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="wallets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="payment">Send</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
              <AlgorandWalletManager />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <AlgorandPaymentDialog />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <div className="grid gap-4 md:grid-cols-2">
            <AlgorandBudgetDashboard />
            <Card>
              <CardHeader>
                <CardTitle>Budget Tips</CardTitle>
                <CardDescription>Best practices for managing your spending</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Start with Testnet</h4>
                  <p className="text-sm text-muted-foreground">
                    Always test your integrations on Testnet before using Mainnet. 
                    Testnet ALGO is free and has the same features.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Set Conservative Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Start with lower daily limits and increase as needed. 
                    The default is 5 ALGO per day with 1 ALGO per task.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Monitor Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    Regularly review your on-chain activity to understand 
                    your spending patterns and detect any anomalies.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <AlgorandActivityLog />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  About Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The activity log tracks all your on-chain operations:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Payments sent and received</li>
                  <li>Heavy task executions</li>
                  <li>Smart contract interactions</li>
                  <li>Budget updates</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Each entry includes the transaction ID for verification 
                  on the blockchain explorer.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Send Payment</CardTitle>
                <CardDescription>
                  Send ALGO or ASA tokens to any Algorand address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlgorandPaymentDialog />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
