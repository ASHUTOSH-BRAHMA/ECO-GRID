import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [energyData, setEnergyData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const wantsEnergySubscriptionRef = useRef(false);
  const hasLoggedConnectionIssueRef = useRef(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      hasLoggedConnectionIssueRef.current = false;
      if (wantsEnergySubscriptionRef.current) {
        socket.emit('subscribe-energy-data');
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      if (!hasLoggedConnectionIssueRef.current) {
        hasLoggedConnectionIssueRef.current = true;
      }
    });

    // Listen for energy data updates
    socket.on('energy-data', (data) => {
      // Keep a unique object identity for every frame so React effects always run.
      setEnergyData({
        ...(data || {}),
        _receivedAt: Date.now(),
      });
    });

    // Listen for listing updates
    socket.on('listing-created', (listing) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'listing',
        message: `New listing: ${listing.title}`,
        data: listing,
        timestamp: new Date()
      }]);
    });

    socket.on('listing-updated', (listing) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'listing-update',
        message: `Listing updated: ${listing.title}`,
        data: listing,
        timestamp: new Date()
      }]);
    });

    // Listen for trade notifications
    socket.on('trade-completed', (trade) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'trade',
        message: `Trade completed: ${trade.amount} kWh`,
        data: trade,
        timestamp: new Date()
      }]);
    });

    // Listen for price updates
    socket.on('price-update', (priceData) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'price',
        message: `Energy price updated to ${priceData.price} ETK/kWh`,
        data: priceData,
        timestamp: new Date()
      }]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Join user-specific room
  const joinUserRoom = useCallback((userId) => {
    if (socketRef.current && userId) {
      socketRef.current.emit('join-user-room', userId);
    }
  }, []);

  // Join marketplace room
  const joinMarketplace = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('join-marketplace');
    }
  }, []);

  // Subscribe to energy data
  const subscribeToEnergyData = useCallback(() => {
    wantsEnergySubscriptionRef.current = true;
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-energy-data');
    }

    return () => {
      wantsEnergySubscriptionRef.current = false;
      if (socketRef.current?.connected) {
        socketRef.current.emit('unsubscribe-energy-data');
      }
    };
  }, []);

  // Clear a notification
  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Emit custom event
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    isConnected,
    energyData,
    notifications,
    joinUserRoom,
    joinMarketplace,
    subscribeToEnergyData,
    clearNotification,
    clearAllNotifications,
    emit
  };
};

export default useSocket;
