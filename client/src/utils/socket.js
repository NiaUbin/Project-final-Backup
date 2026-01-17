import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    // Use environment variable or fallback to proxy
    const serverUrl = process.env.REACT_APP_API_URL || '';
    socketInstance = io(serverUrl || window.location.origin, {
      withCredentials: true,
      transports: ['websocket']
    });
  }
  return socketInstance;
}

export function joinUserRoom(userId) {
  const socket = getSocket();
  if (userId) {
    socket.emit('join_user_room', userId);
  }
}

export function onOrderStatusUpdated(callback) {
  const socket = getSocket();
  socket.on('order_status_updated', callback);
  return () => socket.off('order_status_updated', callback);
}


