import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Компонент для генерации QR-кода
 * Использует canvas для отрисовки (простая реализация)
 * Для production можно использовать библиотеку qrcode.react
 */
export function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    // Простая реализация через canvas
    // Для production лучше использовать библиотеку qrcode.react
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Простая заглушка - показываем текст
    // В production замените на реальную генерацию QR-кода
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, size / 2 - 10);
    ctx.fillText(value.substring(0, 20), size / 2, size / 2 + 10);
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
    />
  );
}
