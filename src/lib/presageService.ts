export interface VitalData {
  heart_rate: number;
  breathing_rate: number;
  heart_rate_variability: number;
  stress_level: number;
  is_measuring: boolean;
  timestamp: string;
  status: 'idle' | 'starting' | 'measuring' | 'stopped' | 'ready';
}

export interface PresageMessage {
  type: 'vitals' | 'start_measurement' | 'stop_measurement' | 'get_status';
  data?: VitalData;
}

class PresageService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: ((data: VitalData) => void)[] = [];
  private statusHandlers: ((status: string) => void)[] = [];

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:9002');
        
        this.ws.onopen = () => {
          console.log('Connected to Presage WebSocket server');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: PresageMessage = JSON.parse(event.data);
            
            if (message.type === 'vitals' && message.data) {
              // Notify all message handlers
              this.messageHandlers.forEach(handler => handler(message.data!));
              
              // Notify status handlers if status changed
              this.statusHandlers.forEach(handler => handler(message.data!.status));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Presage WebSocket server');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          console.log('Reconnection failed');
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  startMeasurement() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'start_measurement' }));
    }
  }

  stopMeasurement() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'stop_measurement' }));
    }
  }

  getStatus() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get_status' }));
    }
  }

  onVitalUpdate(handler: (data: VitalData) => void) {
    this.messageHandlers.push(handler);
  }

  onStatusUpdate(handler: (status: string) => void) {
    this.statusHandlers.push(handler);
  }

  removeVitalUpdateHandler(handler: (data: VitalData) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  removeStatusUpdateHandler(handler: (status: string) => void) {
    const index = this.statusHandlers.indexOf(handler);
    if (index > -1) {
      this.statusHandlers.splice(index, 1);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const presageService = new PresageService();
