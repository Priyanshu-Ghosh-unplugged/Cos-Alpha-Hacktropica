import { useState, useEffect, useCallback, useRef } from 'react';
import { presageService, VitalData } from '@/lib/presageService';

export interface UsePresageReturn {
  vitals: VitalData | null;
  isConnected: boolean;
  isMeasuring: boolean;
  status: string;
  startMeasurement: () => void;
  stopMeasurement: () => void;
  refreshStatus: () => void;
  error: string | null;
}

export const usePresage = (): UsePresageReturn => {
  const [vitals, setVitals] = useState<VitalData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState<string | null>(null);

  const vitalHandlerRef = useRef<(data: VitalData) => void>();
  const statusHandlerRef = useRef<(status: string) => void>();

  const startMeasurement = useCallback(() => {
    try {
      presageService.startMeasurement();
      setError(null);
    } catch (err) {
      setError('Failed to start measurement');
      console.error('Failed to start measurement:', err);
    }
  }, []);

  const stopMeasurement = useCallback(() => {
    try {
      presageService.stopMeasurement();
      setError(null);
    } catch (err) {
      setError('Failed to stop measurement');
      console.error('Failed to stop measurement:', err);
    }
  }, []);

  const refreshStatus = useCallback(() => {
    try {
      presageService.getStatus();
      setError(null);
    } catch (err) {
      setError('Failed to get status');
      console.error('Failed to get status:', err);
    }
  }, []);

  useEffect(() => {
    // Initialize handlers
    vitalHandlerRef.current = (data: VitalData) => {
      setVitals(data);
      setError(null);
    };

    statusHandlerRef.current = (newStatus: string) => {
      setStatus(newStatus);
    };

    // Register handlers
    if (vitalHandlerRef.current) {
      presageService.onVitalUpdate(vitalHandlerRef.current);
    }
    
    if (statusHandlerRef.current) {
      presageService.onStatusUpdate(statusHandlerRef.current);
    }

    // Connect to WebSocket
    const connectToPresage = async () => {
      try {
        await presageService.connect();
        setIsConnected(true);
        setError(null);
        refreshStatus();
      } catch (err) {
        setError('Failed to connect to Presage service');
        setIsConnected(false);
        console.error('Failed to connect to Presage service:', err);
      }
    };

    connectToPresage();

    // Cleanup
    return () => {
      if (vitalHandlerRef.current) {
        presageService.removeVitalUpdateHandler(vitalHandlerRef.current);
      }
      
      if (statusHandlerRef.current) {
        presageService.removeStatusUpdateHandler(statusHandlerRef.current);
      }
      
      presageService.disconnect();
    };
  }, [refreshStatus]);

  return {
    vitals,
    isConnected,
    isMeasuring: vitals?.is_measuring || false,
    status,
    startMeasurement,
    stopMeasurement,
    refreshStatus,
    error
  };
};
