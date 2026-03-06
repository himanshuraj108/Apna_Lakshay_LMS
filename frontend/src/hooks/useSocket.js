import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export const useSocket = (authDependency = false) => {
    const [isConnected, setIsConnected] = useState(socket ? socket.connected : false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Disconnect existing if token is removed (logout)
        if (!token || !authDependency) {
            if (socket) {
                socket.disconnect();
                socket = null;
                setIsConnected(false);
            }
            return;
        }

        // Initialize socket connection if it doesn't exist
        if (!socket) {
            const baseUrl = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace('/api', '')
                : 'http://localhost:5000';

            socket = io(baseUrl, {
                auth: { token },
                autoConnect: true
            });
        }

        // Setup event listeners for this component instance
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onError = (error) => console.error('Socket error:', error);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('error', onError);

        // Sync initial state just in case it connected before we attached listener
        setIsConnected(socket.connected);

        return () => {
            if (socket) {
                socket.off('connect', onConnect);
                socket.off('disconnect', onDisconnect);
                socket.off('error', onError);
            }
        };
    }, [authDependency]);

    return { socket, isConnected };
};

export const getSocket = () => socket;
