import { useAppStore } from '../store/useAppStore';

let socket: WebSocket | null = null;
let reconnectTimer: any = null;
let heartbeatTimer: any = null;

export function connectWebSocket(wellId: string) {
  if (socket) {
    socket.close();
    socket = null;
  }

  const { setConnectionStatus, updateTelemetry, setSimulatorRunning, setSimulatorSpeed } = useAppStore.getState();
  setConnectionStatus('CONNECTING');

  const rawWs = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const wsUrl = rawWs.includes('/ws/live-well')
    ? (rawWs.endsWith('/ws/live-well') ? `${rawWs}/${wellId}` : rawWs.replace('${wellId}', wellId))
    : `${rawWs.replace(/\/$/, '')}/ws/live-well/${wellId}`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnectionStatus('CONNECTED');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      // Start heartbeat
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send('PING');
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        if (event.data === 'PONG') return;
        const msg = JSON.parse(event.data);
        if (msg.type === 'TELEMETRY' && msg.data) {
          updateTelemetry(msg.data, msg.prediction);
          if (typeof msg.is_running === 'boolean') {
            setSimulatorRunning(msg.is_running);
          }
          if (typeof msg.speed === 'number') {
            setSimulatorSpeed(msg.speed);
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      setConnectionStatus('DISCONNECTED');
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      // Attempt reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          setConnectionStatus('RECONNECTING');
          connectWebSocket(wellId);
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
      setConnectionStatus('DISCONNECTED');
    };
  } catch (err) {
    console.error('WebSocket initialization failure:', err);
    setConnectionStatus('DISCONNECTED');
  }
}

export function sendWebSocketCommand(cmd: 'START' | 'PAUSE' | 'RESET') {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(cmd);
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (socket) {
    socket.close();
    socket = null;
  }
}
