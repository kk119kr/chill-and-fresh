import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../../services/socketService';

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // 1초마다 소켓 상태 확인
    const checkStatus = () => {
      const currentStatus = socketService.getConnectionStatus() as 'connected' | 'connecting' | 'disconnected' | 'error';
      
      if (currentStatus === 'error' || currentStatus === 'disconnected') {
        setStatus(currentStatus);
        setVisible(true);
      } else if (currentStatus === 'connecting') {
        setStatus('connecting');
        setVisible(true);
      } else if (currentStatus === 'connected' && visible) {
        // 연결 성공 시 잠시 표시 후 사라짐
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
        return 'bg-black';
      case 'connecting':
        return 'bg-gray-500';
      case 'disconnected':
      case 'error':
        return 'bg-gray-700';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getMessage = () => {
    switch (status) {
      case 'connected':
        return 'CONNECTED';
      case 'connecting':
        return 'CONNECTING...';
      case 'disconnected':
        return 'DISCONNECTED';
      case 'error':
        return 'CONNECTION ERROR';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="fixed top-4 left-4 z-50">
          {/* 텍스트박스 없이 간단한 상태 표시 */}
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 상태 표시 사각형 */}
            <motion.div 
              className={`w-3 h-3 ${getStatusColor()}`}
              animate={{ 
                opacity: status === 'connecting' ? [1, 0.3, 1] : 1,
              }}
              transition={{ 
                repeat: status === 'connecting' ? Infinity : 0,
                duration: 1.5
              }}
            />
            
            <span className={`
              font-mono text-xs font-medium tracking-widest uppercase
              ${status === 'connected' ? 'text-black' : 
                status === 'connecting' ? 'text-gray-600' : 
                'text-gray-700'}
            `}>
              {getMessage()}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;