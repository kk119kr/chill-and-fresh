import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../../services/socketService';

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // 1초마다 소켓 상태 확인
    const checkStatus = () => {
      const currentStatus = socketService.getConnectionStatus();
      
      if (currentStatus === 'error' || currentStatus === 'disconnected') {
        setStatus(currentStatus);
        setVisible(true);
      } else if (currentStatus === 'connecting') {
        setStatus('connecting');
        setVisible(true);
      } else if (currentStatus === 'connected' && visible) {
        // 연결 성공 시 잠시 초록색 바 표시 후 사라짐
        setStatus('connected');
        setTimeout(() => {
          setVisible(false);
        }, 2000);
      } else {
        setStatus('connected');
        setVisible(false);
      }
    };
    
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, [visible]);
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getMessage = () => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'connecting':
        return '연결 중...';
      case 'disconnected':
        return '연결 끊김';
      case 'error':
        return '연결 오류';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed top-0 left-0 right-0 h-1 z-50 ${getStatusColor()}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-white text-xs px-2 py-1 rounded-full shadow-sm"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {getMessage()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;