import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Initialize socket connection
        if (!socketRef.current) {
            // Get base URL without /api path for Socket.io
            const baseUrl = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace('/api', '')
                : 'http://localhost:5000';

            socketRef.current = io(baseUrl, {
                auth: { token },
                autoConnect: true
            });

            socket = socketRef.current;

            socket.on('connect', () => {

                setIsConnected(true);
            });

            socket.on('disconnect', () => {

                setIsConnected(false);
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                socket = null;
            }
        };
    }, []);

    return { socket: socketRef.current, isConnected };
};

export const getSocket = () => socket;
