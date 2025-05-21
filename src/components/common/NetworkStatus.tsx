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
        return 'bg-ink-black';
      case 'connecting':
        return 'bg-ink-gray-500';
      case 'disconnected':
      case 'error':
        return 'bg-ink-gray-700';
      default:
        return 'bg-ink-gray-500';
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
        <motion.div className="fixed inset-x-0 top-0 z-50 overflow-hidden">
          {/* 유기적인 잉크 효과를 가진 연결 상태 표시 */}
          <motion.svg
            width="100%"
            height="6"
            viewBox="0 0 100 6"
            preserveAspectRatio="none"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ filter: 'url(#ink-spread)' }}
          >
            <defs>
              <filter id="ink-spread">
                <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" seed="1" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
            </defs>
            <rect x="0" y="0" width="100%" height="6" className={getStatusColor()} />
          </motion.svg>
          
          {/* 메시지 박스 */}
          <motion.div 
            className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-ink-white text-xs px-3 py-1.5 rounded-full shadow-md border border-ink-gray-100"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.span 
              className={`
                ${status === 'connected' ? 'text-ink-black' : 
                  status === 'connecting' ? 'text-ink-gray-600' : 
                  'text-ink-gray-700'}
                font-medium
              `}
              animate={{ 
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2
              }}
            >
              {/* 상태 표시 점 */}
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" 
                style={{ 
                  backgroundColor: status === 'connected' ? 'currentColor' : 
                    status === 'connecting' ? 'currentColor' : 
                    'currentColor'
                }}
              />
              {getMessage()}
            </motion.span>
          </motion.div>
          
          {/* 잉크 방울 효과 - 연결 상태가 변경될 때만 표시 */}
          {status === 'connected' && (
            <motion.div
              className="absolute top-2 left-1/2"
              initial={{ y: -5, opacity: 0 }}
              animate={{ 
                y: [-5, 30],
                opacity: [0, 0.1, 0]
              }}
              transition={{ duration: 1.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-ink-black"
                animate={{ 
                  scale: [1, 0.8, 0.5],
                }}
                transition={{ duration: 1.5 }}
                style={{ filter: 'blur(1px)' }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;