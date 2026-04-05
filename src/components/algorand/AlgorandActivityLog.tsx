/**
 * Algorand Activity Log Component
 * 
 * UI for viewing on-chain activity and transactions.
 */

import { useState } from 'react';
import { Activity, Clock, CheckCircle, XCircle, Clock3, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandActivity } from '@/hooks/useAlgorand';
import { exportActivities, clearAllActivities } from '@/lib/algorand';
import type { AlgorandNetwork, OnChainActivity } from '@/lib/algorand/types';

const NETWORK_EXPLORERS: Record<AlgorandNetwork, string> = {
  mainnet: 'https://explorer.perawallet.app',
  testnet: 'https://testnet.explorer.perawallet.app',
  betanet: 'https://betanet.explorer.perawallet.app',
  localnet: '',
};

const TYPE_LABELS: Record<OnChainActivity['type'], string> = {
  payment: 'Payment',
  heavy_task: 'Heavy Task',
  contract_interaction: 'Contract',
  budget_update: 'Budget',
};

const TYPE_COLORS: Record<OnChainActivity['type'], string> = {
  payment: 'bg-blue-100 text-blue-800',
  heavy_task: 'bg-purple-100 text-purple-800',
  contract_interaction: 'bg-orange-100 text-orange-800',
  budget_update: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS = {
  pending: Clock3,
  confirmed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLORS = {
  pending: 'text-yellow-500',
  confirmed: 'text-green-500',
  failed: 'text-red-500',
};

export function AlgorandActivityLog() {
  const { toast } = useToast();
  const { activities, stats, isLoading, refresh } = useAlgorandActivity(50);
  const [activeTab, setActiveTab] = useState('all');

  const filteredActivities = activities.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    if (activeTab === 'failed') return a.status === 'failed';
    return a.type === activeTab;
  });

  const handleExport = () => {
    const data = exportActivities();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorand-activity-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Exported', description: 'Activity log exported successfully' });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all activity history?')) {
      clearAllActivities();
      toast({ title: 'Cleared', description: 'Activity history has been cleared' });
      refresh();
    }
  };

  const openExplorer = (txId: string, network: AlgorandNetwork) => {
    if (!txId || !NETWORK_EXPLORERS[network]) return;
    window.open(`${NETWORK_EXPLORERS[network]}/tx/${txId}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            On-Chain Activity
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Track your Algorand transactions and operations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded bg-muted">
            <div className="text-lg font-bold">{stats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded bg-yellow-50">
            <div className="text-lg font-bold text-yellow-600">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-2 rounded bg-green-50">
            <div className="text-lg font-bold text-green-600">{stats?.confirmed || 0}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </div>
          <div className="text-center p-2 rounded bg-red-50">
            <div className="text-lg font-bold text-red-600">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="heavy_task">Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Done</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[300px]">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activities found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity}
                      onOpenExplorer={() => openExplorer(activity.txId || '', activity.network)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Clear Button */}
        {activities.length > 0 && (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleClear}>
            Clear History
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ 
  activity, 
  onOpenExplorer 
}: { 
  activity: OnChainActivity;
  onOpenExplorer: () => void;
}) {
  const StatusIcon = STATUS_ICONS[activity.status];
  const typeLabel = TYPE_LABELS[activity.type];
  const typeColor = TYPE_COLORS[activity.type];

  return (
    <div className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <StatusIcon className={`h-5 w-5 mt-0.5 ${STATUS_COLORS[activity.status]}`} />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${typeColor}`}>
                {typeLabel}
              </Badge>
              {activity.network !== 'mainnet' && (
                <Badge variant="outline" className="text-xs">
                  {activity.network}
                </Badge>
              )}
            </div>
            <p className="text-sm mt-1">{activity.description}</p>
            {activity.amount && (
              <p className="text-sm font-medium text-muted-foreground">
                {activity.asset}: {activity.amount.toString()} micro
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        {activity.txId && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenExplorer}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
