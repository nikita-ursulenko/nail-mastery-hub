import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

/**
 * Компонент для генерации QR-кода
 * Использует библиотеку qrcode.react для генерации реального QR-кода
 */
export function QRCode({ 
  value, 
  size = 200, 
  className = '',
  level = 'M',
  includeMargin = true 
}: QRCodeProps) {
  if (!value) {
    return (
      <div 
        className={className}
        style={{ 
          width: size + 32, 
          height: size + 32, 
          border: '1px solid #e5e7eb', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <span className="text-xs text-muted-foreground">Нет ссылки</span>
      </div>
    );
  }

  return (
    <div 
      className={className}
      id="qr-code-container"
      style={{ 
        padding: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        display: 'inline-block',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        imageSettings={{
          src: '',
          height: 0,
          width: 0,
          excavate: false,
        }}
      />
    </div>
  );
}
