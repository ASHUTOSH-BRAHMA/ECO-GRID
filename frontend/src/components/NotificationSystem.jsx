import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle, Info, Zap, ShoppingCart } from 'lucide-react';
import useSocket from '../hooks/useSocket';

// Consistent dark theme colors
const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff"
};

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'trade':
      return <ShoppingCart className="w-5 h-5 text-[#00e5a0]" />;
    case 'listing':
      return <Zap className="w-5 h-5 text-[#ffd166]" />;
    case 'price':
      return <Bell className="w-5 h-5 text-[#4d9fff]" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-[#00e5a0]" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-[#ff4d6d]" />;
    case 'peak':
      return <AlertCircle className="w-5 h-5 text-[#ffd166]" />;
    default:
      return <Info className="w-5 h-5 text-[#4d9fff]" />;
  }
};

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('ecogrid_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return parsed.filter(n => new Date(n.timestamp).getTime() > oneDayAgo);
      }
    } catch(e) {}
    return [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    return parseInt(localStorage.getItem('ecogrid_unread') || "0");
  });
  const [isOpen, setIsOpen] = useState(false);
  const { notifications: socketNotifications, clearNotification } = useSocket();

  useEffect(() => {
    if (socketNotifications.length > 0) {
      const latest = socketNotifications[socketNotifications.length - 1];
      if (!notifications.find(n => n.id === latest.id)) {
        addNotification({
          id: latest.id,
          type: latest.type,
          title: latest.message,
          timestamp: latest.timestamp,
        });
      }
    }
  }, [socketNotifications]);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now() + Math.random(),
      timestamp: notification.timestamp || new Date(),
    };
    // don't add duplicate IDs from localStorage
    setNotifications(prev => {
      if(prev.find(n => n.id === newNotification.id)) return prev;
      return [newNotification, ...prev].slice(0, 50);
    });
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    localStorage.setItem('ecogrid_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ecogrid_unread', unreadCount.toString());
  }, [unreadCount]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    clearNotification(id);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    window.addNotification = addNotification;
    return () => {
      delete window.addNotification;
    };
  }, []);

  // Fetch initial peak alerts
  useEffect(() => {
    // Add mock global alerts first (Optional but good for fallback)
    setTimeout(() => {
      addNotification({
        id: `sys-${Date.now()}`, type: "peak", title: "Peak Demand Expected",
        description: "Prices may rise 1.4x from 6 PM to 9 PM. Avoid non-essential usage.",
      });
    }, 2000);

    // Fetch alerts from forecasting backend
    fetch("http://localhost:8000/forecast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_name: "Northern", forecast_hours: 24 })
    })
    .then(r => r.json())
    .then(d => {
      if (d.alerts && Array.isArray(d.alerts)) {
        d.alerts.forEach((a, i) => {
          setTimeout(() => {
            const typeMap = { high: "error", medium: "peak", low: "success" };
            addNotification({
              id: `alert-${Date.now()}-${i}`,
              type: typeMap[a.severity] || "info",
              title: (a.type || "System Alert").replace(/_/g, " "),
              description: a.message,
            });
          }, 3000 + (i * 1000));
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <>
      <div className="fixed top-24 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAllAsRead();
          }}
          className="relative rounded-full p-3 shadow-lg border hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer"
          style={{ background: C.bg3, borderColor: C.border }}
        >
          <Bell className="w-5 h-5" style={{ color: C.text2 }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center"
              style={{ background: C.red }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden"
              style={{ background: C.bg2, borderColor: C.border }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
                <h3 className="font-semibold text-sm tracking-wide uppercase" style={{ color: C.text, fontFamily:"'Syne',sans-serif" }}>Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    style={{ color: C.text3 }}
                    className="text-xs hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center" style={{ color: C.text3 }}>
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-mono">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => {
                    const typeColor = notification.type === 'error' ? C.red : notification.type === 'success' || notification.type === 'trade' ? C.green : notification.type === 'listing' || notification.type === 'peak' ? C.yellow : C.blue;
                    return (
                      <div
                        key={notification.id}
                        className="p-3 border-b transition-colors hover:bg-black/20"
                        style={{ borderColor: C.border }}
                      >
                        <div className="flex items-start gap-3">
                          <NotificationIcon type={notification.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: C.text }}>{notification.title}</p>
                            {notification.description && (
                              <p className="text-xs mt-0.5" style={{ color: C.text2, lineHeight: 1.4 }}>{notification.description}</p>
                            )}
                            <p className="text-[10px] mt-1 uppercase" style={{ color: typeColor }}>
                              {new Date(notification.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                            </p>
                          </div>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                            style={{ color: C.text3 }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </>
  );
};

export default NotificationSystem;
