/**
 * Algorand Budget Dashboard Component
 * 
 * UI for viewing and managing spending budgets.
 */

import { useState } from 'react';
import { PiggyBank, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandBudget } from '@/hooks/useAlgorand';
import { setBudgetConfig, resetDailyBudget } from '@/lib/algorand';

export function AlgorandBudgetDashboard() {
  const { toast } = useToast();
  const { config, status, summary, isLoading, refresh } = useAlgorandBudget();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('5');
  const [perTaskLimit, setPerTaskLimit] = useState('1');
  const [warningThreshold, setWarningThreshold] = useState(80);

  const handleSaveSettings = () => {
    try {
      const dailyLimitMicro = BigInt(Math.round(parseFloat(dailyLimit) * 1000000));
      const perTaskLimitMicro = BigInt(Math.round(parseFloat(perTaskLimit) * 1000000));
      
      setBudgetConfig({
        dailyLimit: dailyLimitMicro,
        perTaskLimit: perTaskLimitMicro,
        warningThreshold,
        asset: 'ALGO',
      });
      
      toast({ title: 'Budget Updated', description: 'Your spending limits have been updated' });
      setSettingsOpen(false);
      refresh();
    } catch {
      toast({ title: 'Error', description: 'Invalid budget values', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    resetDailyBudget();
    toast({ title: 'Budget Reset', description: 'Daily spending has been reset' });
    refresh();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Budget
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

  const percentUsed = summary?.percentUsed || 0;
  const isWarning = summary?.isWarning || false;
  const isExceeded = summary?.isExceeded || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Spending Budget
          </CardTitle>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Budget Settings</DialogTitle>
                <DialogDescription>
                  Set your daily and per-task spending limits.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Daily Limit (ALGO)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per-Task Limit (ALGO)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={perTaskLimit}
                    onChange={(e) => setPerTaskLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warning Threshold ({warningThreshold}%)</Label>
                  <Slider 
                    value={[warningThreshold]} 
                    onValueChange={(v) => setWarningThreshold(v[0])}
                    min={50} 
                    max={95} 
                    step={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Track and control your Algorand spending
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          {isExceeded ? (
            <Badge variant="destructive" className="text-sm py-1 px-3">
              <XCircle className="h-4 w-4 mr-1" />
              Budget Exceeded
            </Badge>
          ) : isWarning ? (
            <Badge variant="secondary" className="text-sm py-1 px-3 bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Warning: {Math.round(percentUsed)}% Used
            </Badge>
          ) : (
            <Badge variant="default" className="text-sm py-1 px-3 bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              On Track
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Daily Usage</span>
            <span className="font-medium">{Math.round(percentUsed)}%</span>
          </div>
          <Progress 
            value={Math.min(percentUsed, 100)} 
            className={`h-2 ${isExceeded ? 'bg-destructive/20' : isWarning ? 'bg-yellow-200' : ''}`}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground mb-1">Daily Limit</div>
            <div className="font-medium">{summary?.dailyLimit || '0 ALGO'}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground mb-1">Spent Today</div>
            <div className={`font-medium ${isExceeded ? 'text-destructive' : ''}`}>
              {summary?.dailySpent || '0 ALGO'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground mb-1">Remaining</div>
            <div className="font-medium text-green-600">{summary?.dailyRemaining || '0 ALGO'}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground mb-1">Per-Task Limit</div>
            <div className="font-medium">{summary?.perTaskLimit || '0 ALGO'}</div>
          </div>
        </div>

        {/* Transactions Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Transactions Today</span>
          <span className="font-medium">{summary?.transactionsToday || 0}</span>
        </div>

        {/* Reset Button */}
        <Button variant="outline" className="w-full" onClick={handleReset}>
          Reset Daily Budget
        </Button>
      </CardContent>
    </Card>
  );
}
