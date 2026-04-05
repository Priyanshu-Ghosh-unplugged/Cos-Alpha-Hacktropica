import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Clock, 
  Coffee, 
  Eye, 
  Heart, 
  Brain, 
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { VitalMonitor } from './VitalMonitor';
import { usePresage } from '@/hooks/usePresage';

export const HealthDashboard: React.FC = () => {
  const { vitals, isMeasuring } = usePresage();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock screen time data (since we removed the hook)
  const mockScreenTime = {
    currentSessionMinutes: 45,
    totalMinutes: 180,
    sessionsToday: 3,
    averageSessionLength: 60,
    isOnBreak: false
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getHealthScore = () => {
    let score = 100;
    
    // Deduct points for excessive screen time
    if (mockScreenTime.currentSessionMinutes > 120) score -= 20;
    else if (mockScreenTime.currentSessionMinutes > 90) score -= 10;
    else if (mockScreenTime.currentSessionMinutes > 60) score -= 5;
    
    // Deduct points for high stress
    if (vitals && isMeasuring) {
      if (vitals.stress_level > 0.8) score -= 25;
      else if (vitals.stress_level > 0.6) score -= 15;
      else if (vitals.stress_level > 0.4) score -= 5;
    }
    
    // Deduct points for abnormal heart rate
    if (vitals && isMeasuring) {
      if (vitals.heart_rate > 100 || vitals.heart_rate < 50) score -= 15;
    }
    
    return Math.max(0, score);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Health & Wellness Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthScoreColor(healthScore)}`}>
              {healthScore}
            </div>
            <div className="text-sm text-gray-600">Health Score</div>
            <div className={`text-xs ${getHealthScoreColor(healthScore)}`}>
              {getHealthScoreText(healthScore)}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Screen Time Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Session</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(mockScreenTime.currentSessionMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  {mockScreenTime.isOnBreak ? 'On break' : 'Active'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(mockScreenTime.totalMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  {mockScreenTime.sessionsToday} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(Math.round(mockScreenTime.averageSessionLength))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mockScreenTime.isOnBreak ? 'Break in progress' : 'Working'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Vital Summary */}
          {vitals && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Heart className="h-6 w-6 mx-auto mb-1 text-red-500" />
                    <div className="text-lg font-semibold">{Math.round(vitals.heart_rate)}</div>
                    <div className="text-xs text-gray-600">BPM</div>
                  </div>
                  <div className="text-center">
                    <Activity className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <div className="text-lg font-semibold">{Math.round(vitals.breathing_rate)}</div>
                    <div className="text-xs text-gray-600">Breaths/min</div>
                  </div>
                  <div className="text-center">
                    <Brain className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                    <div className="text-lg font-semibold">{vitals.heart_rate_variability.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">HRV (ms)</div>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                    <div className="text-lg font-semibold">{Math.round(vitals.stress_level * 100)}%</div>
                    <div className="text-xs text-gray-600">Stress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vitals">
          <VitalMonitor />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Screen time tracking and recommendations</p>
                <p className="text-sm">Feature temporarily disabled</p>
              </div>
            </CardContent>
          </Card>

          {/* Health Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Health Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Eye Health</span>
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Follow 20-20-20 rule every 20 minutes</li>
                    <li>• Position monitor 20-26 inches away</li>
                    <li>• Adjust screen brightness to match surroundings</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Physical Health</span>
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Take breaks every 60 minutes</li>
                    <li>• Maintain good posture</li>
                    <li>• Stay hydrated throughout the day</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
