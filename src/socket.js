import { io } from 'socket.io-client';

export const initSocket = () => io(process.env.REACT_APP_BACKEND_URL || window.location.origin, {
    auth: { token: localStorage.getItem('codefusion_token') },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 5000,
    timeout: 10000,
});
