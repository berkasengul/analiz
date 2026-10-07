import type { ElementType, ReactNode } from 'react';

/**
 * Ürün değişince metin 0.6 sn'de aşağıdan yukarı kayarak (opacity + translateY 24px) gelir.
 * `k` değişince öğe yeniden oluşturulur ve CSS giriş animasyonu oynar.
 */
export function Swap({ k, as: Tag = 'div', className = '', children, delay = 0 }: {
  k: string | number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Tag key={k} className={`swap-in ${className}`} style={delay ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </Tag>
  );
}
