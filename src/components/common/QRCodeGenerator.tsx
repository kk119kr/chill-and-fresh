import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  title?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'H', 
  includeMargin = true,
  title
}) => {
  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500">QR 코드 생성 준비 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <QRCodeSVG
          value={value} 
          size={size} 
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          includeMargin={includeMargin}
        />
      </div>
      {title && <p className="mt-2 text-sm text-gray-500">{title}</p>}
    </div>
  );
};

export default QRCodeGenerator;