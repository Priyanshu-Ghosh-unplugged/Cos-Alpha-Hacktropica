import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  GitBranch, 
  Shield, 
  Zap,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  startTime: string;
  lastUpdate: string;
  chain: 'algorand' | 'stellar' | 'solana' | 'multi';
}

interface SecurityAlert {
  id: string;
  chain: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
}

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  chain: string;
  recipient: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
}

export const SuperPlaneDashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    securityAlerts: 0,
    paymentsProcessed: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch data from SuperPlane API
      const [workflowsRes, alertsRes, paymentsRes] = await Promise.all([
        fetch('/api/superplane/workflows'),
        fetch('/api/superplane/security/alerts'),
        fetch('/api/superplane/payments')
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setSecurityAlerts(alertsData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Calculate stats
      setStats({
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.status === 'running').length,
        securityAlerts: securityAlerts.filter(a => a.status === 'open').length,
        paymentsProcessed: payments.filter(p => p.status === 'completed').length,
        totalValue: payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case 'algorand': return <Globe className="h-4 w-4" />;
      case 'stellar': return <Zap className="h-4 w-4" />;
      case 'solana': return <TrendingUp className="h-4 w-4" />;
      case 'multi': return <GitBranch className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SuperPlane Control Center</h1>
          <p className="text-gray-600">Multi-chain DevOps workflow orchestration</p>
        </div>
        <Button onClick={() => window.open('http://localhost:3000', '_blank')}>
          Open SuperPlane UI
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWorkflows} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments Processed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentsProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Processed amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>
                Deployment and automation workflows running across all chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow.status)}`} />
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-sm text-gray-600">
                          {getChainIcon(workflow.chain)}
                          <span className="ml-2">{workflow.chain}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{workflow.status}</p>
                        <p className="text-xs text-gray-600">{workflow.lastUpdate}</p>
                      </div>
                      <Progress value={workflow.progress} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Real-time security monitoring and incident response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.map((alert) => (
                  <Alert key={alert.id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center space-x-2">
                      <span>{alert.message}</span>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">
                          {getChainIcon(alert.chain)}
                          <span className="ml-2">{alert.chain} • {alert.timestamp}</span>
                        </span>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Cross-chain payment processing and escrow management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <DollarSign className="h-4 w-4" />
                      <div>
                        <p className="font-medium">
                          ${payment.amount} {payment.currency}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getChainIcon(payment.chain)}
                          <span className="ml-2">{payment.chain}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{payment.status}</p>
                      <p className="text-xs text-gray-600">{payment.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Chain Health</CardTitle>
                <CardDescription>
                  Real-time blockchain connectivity and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['algorand', 'stellar', 'solana'].map((chain) => (
                    <div key={chain} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getChainIcon(chain)}
                        <span className="capitalize">{chain}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Healthy</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest workflow executions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Deployment pipeline completed</span>
                    <span className="text-gray-600">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Payment processed on Stellar</span>
                    <span className="text-gray-600">5 min ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Security scan completed</span>
                    <span className="text-gray-600">10 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
