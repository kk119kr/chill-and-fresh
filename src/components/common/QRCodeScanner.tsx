import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
  facingMode?: 'environment' | 'user';
  qrboxSize?: number;
  fps?: number;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScan, 
  onError,
  width = 300,
  height = 300,
  facingMode = 'environment',
  qrboxSize = 250,
  fps = 10
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
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
        setPermissionError(null);
        await scannerRef.current?.start(
          { facingMode }, // 후면 카메라 사용
          {
            fps,
            qrbox: { width: qrboxSize, height: qrboxSize },
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
        if (err instanceof Error && err.message.includes('permission')) {
          setPermissionError('카메라 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
        } else {
          setPermissionError('QR 코드 스캐너를 시작하는 중 오류가 발생했습니다.');
        }
        if (onError) onError(String(err));
      }
    };

    startScanner();
  }, [isScanning, onScan, onError, facingMode, qrboxSize, fps]);

  return (
    <div className="w-full max-w-md mx-auto">
      {permissionError ? (
        <div className="w-full p-4 bg-red-50 rounded-lg text-center">
          <p className="text-red-600">{permissionError}</p>
          <button 
            className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg"
            onClick={() => setIsScanning(true)}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div 
            id={scannerContainerId} 
            className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden"
            style={{ width, height }}
          ></div>
          <p className="text-center text-sm mt-2 text-gray-500">
            QR 코드를 카메라에 위치시키세요
          </p>
        </>
      )}
    </div>
  );
};

export default QRCodeScanner;