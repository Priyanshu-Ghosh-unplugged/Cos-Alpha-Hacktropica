import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Activity, Brain, AlertTriangle } from 'lucide-react';
import { usePresage } from '@/hooks/usePresage';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VitalMonitorProps {
  className?: string;
}

export const VitalMonitor: React.FC<VitalMonitorProps> = ({ className }) => {
  const {
    vitals,
    isConnected,
    isMeasuring,
    status,
    startMeasurement,
    stopMeasurement,
    refreshStatus,
    error
  } = usePresage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'measuring': return 'bg-green-500';
      case 'ready': return 'bg-blue-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopped': return 'bg-gray-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'measuring': return 'Measuring';
      case 'ready': return 'Ready';
      case 'starting': return 'Starting';
      case 'stopped': return 'Stopped';
      case 'idle': return 'Idle';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getStressLevelColor = (stress: number) => {
    if (stress < 0.3) return 'text-green-600';
    if (stress < 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStressLevelText = (stress: number) => {
    if (stress < 0.3) return 'Low';
    if (stress < 0.6) return 'Moderate';
    return 'High';
  };

  const getHeartRateColor = (hr: number) => {
    if (hr < 60) return 'text-blue-600';
    if (hr > 100) return 'text-red-600';
    return 'text-green-600';
  };

  const getAbnormalities = () => {
    if (!vitals || !isMeasuring) return [];

    const abnormalities = [];
    
    if (vitals.heart_rate > 100) {
      abnormalities.push('Elevated heart rate detected');
    } else if (vitals.heart_rate < 50 && vitals.heart_rate > 0) {
      abnormalities.push('Low heart rate detected');
    }

    if (vitals.breathing_rate > 20) {
      abnormalities.push('Rapid breathing detected');
    } else if (vitals.breathing_rate < 12 && vitals.breathing_rate > 0) {
      abnormalities.push('Slow breathing detected');
    }

    if (vitals.stress_level > 0.7) {
      abnormalities.push('High stress level detected');
    }

    return abnormalities;
  };

  const abnormalities = getAbnormalities();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vital Signs Monitor</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className={getStatusColor(status)}
              >
                {getStatusText(status)}
              </Badge>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-2 mb-4">
            <Button 
              onClick={startMeasurement}
              disabled={!isConnected || isMeasuring}
              className="flex-1"
            >
              {isMeasuring ? 'Measuring...' : 'Start Measurement'}
            </Button>
            <Button 
              onClick={stopMeasurement}
              disabled={!isConnected || !isMeasuring}
              variant="outline"
              className="flex-1"
            >
              Stop Measurement
            </Button>
            <Button 
              onClick={refreshStatus}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>

          {/* Vital Signs Display */}
          {vitals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Heart Rate */}
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Heart Rate</p>
                      <p className={`text-2xl font-bold ${getHeartRateColor(vitals.heart_rate)}`}>
                        {vitals.heart_rate > 0 ? Math.round(vitals.heart_rate) : '--'}
                      </p>
                      <p className="text-xs text-gray-500">BPM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breathing Rate */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Breathing</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {vitals.breathing_rate > 0 ? Math.round(vitals.breathing_rate) : '--'}
                      </p>
                      <p className="text-xs text-gray-500">breaths/min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heart Rate Variability */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">HRV</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {vitals.heart_rate_variability > 0 ? vitals.heart_rate_variability.toFixed(1) : '--'}
                      </p>
                      <p className="text-xs text-gray-500">ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stress Level */}
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Stress</p>
                      <p className={`text-2xl font-bold ${getStressLevelColor(vitals.stress_level)}`}>
                        {getStressLevelText(vitals.stress_level)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(vitals.stress_level * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Abnormalities Alert */}
          {abnormalities.length > 0 && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="font-semibold mb-1">Health Alerts:</div>
                <ul className="list-disc list-inside space-y-1">
                  {abnormalities.map((abnormality, index) => (
                    <li key={index} className="text-sm">{abnormality}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Timestamp */}
          {vitals && vitals.timestamp && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              Last updated: {vitals.timestamp}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
