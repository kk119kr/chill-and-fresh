import React from 'react';
import { QRCodeSVG } from 'qrcode.react';  // named import 사용

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 200 }) => {
  return (
    <div className="flex justify-center">
      <QRCodeSVG
        value={value} 
        size={size} 
        level="H" 
        includeMargin={true}
      />
    </div>
  );
};

export default QRCodeGenerator;