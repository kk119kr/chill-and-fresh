// src/components/common/QRCodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  useEffect(() => {
    // 스캐너 초기화
    scannerRef.current = new Html5Qrcode(scannerContainerId);
    setIsScanning(true);

    return () => {
      // 컴포넌트 언마운트 시 스캐너 정리
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch(err => console.error('스캐너 중지 오류:', err));
      }
    };
  }, []);

  useEffect(() => {
    if (!scannerRef.current || !isScanning) return;

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: 'environment' }, // 후면 카메라 사용
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText); // 스캔 결과 전달
            setIsScanning(false);
            scannerRef.current?.stop().catch(console.error);
          },
          (errorMessage) => {
            if (onError) onError(errorMessage);
            console.error('QR 코드 스캔 오류:', errorMessage);
          }
        );
      } catch (err) {
        console.error('스캐너 시작 오류:', err);
        if (onError) onError(String(err));
      }
    };

    startScanner();
  }, [isScanning, onScan, onError]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        id={scannerContainerId} 
        className="w-full h-64 bg-gray-100 rounded-lg"
      ></div>
      <p className="text-center text-sm mt-2 text-gray-500">
        QR 코드를 카메라에 위치시키세요
      </p>
    </div>
  );
};

export default QRCodeScanner;