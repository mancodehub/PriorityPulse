import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

let socket = null;

/**
 * Returns an authenticated, shared Socket.io client instance.
 * Automatically handles reconnection and uses the stored JWT token.
 *
 * @returns {import("socket.io-client").Socket | null}
 */
export const getSocket = () => {
  const token = localStorage.getItem('pp_token');
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket) {
    socket = io(getSocketUrl(), {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to real-time notification service');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};

/**
 * Cleanly disconnects and clears the shared socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

