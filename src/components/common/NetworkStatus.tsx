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
        <motion.div className="fixed inset-x-0 top-0 z-50">
          {/* 기하학적 상태 표시 바 */}
          <motion.div
            className={`h-1 w-full ${getStatusColor()}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut",
              transformOrigin: "left"
            }}
          />
          
          {/* 상태 메시지 박스 */}
          <motion.div 
            className="absolute top-2 left-1/2 transform -translate-x-1/2 
                       bg-white border-2 border-black px-4 py-2
                       font-mono text-xs font-medium tracking-widest uppercase"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <div className="flex items-center space-x-3">
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
                ${status === 'connected' ? 'text-black' : 
                  status === 'connecting' ? 'text-gray-600' : 
                  'text-gray-700'}
              `}>
                {getMessage()}
              </span>
            </div>
          </motion.div>
          
          {/* 기하학적 장식 요소 */}
          <motion.div
            className="absolute top-0 right-4 w-8 h-8 border-2 border-black bg-white"
            initial={{ rotate: 0, scale: 0 }}
            animate={{ 
              rotate: 45, 
              scale: 1,
              opacity: [1, 0.7, 1]
            }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ 
              duration: 0.3,
              opacity: {
                repeat: Infinity,
                duration: 2
              }
            }}
          />
          
          {/* 연결 성공 시 떨어지는 기하학적 요소 */}
          {status === 'connected' && (
            <motion.div
              className="absolute top-4 left-1/4"
              initial={{ y: 0, opacity: 1 }}
              animate={{ 
                y: 50,
                opacity: 0,
                rotate: [0, 90, 180]
              }}
              transition={{ duration: 1.2 }}
            >
              <div className="w-2 h-2 bg-black" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;