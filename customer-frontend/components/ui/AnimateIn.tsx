'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'left' | 'right' | 'in';

interface Props {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  threshold?: number;
}

const animClass: Record<Direction, string> = {
  up:    'anim-fade-up',
  left:  'anim-fade-left',
  right: 'anim-fade-right',
  in:    'anim-fade-in',
};

export default function AnimateIn({
  children,
  direction = 'up',
  delay = 0,
  className,
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={cn(visible ? animClass[direction] : undefined, className)}
      style={
        visible
          ? delay ? { animationDelay: `${delay}ms` } : undefined
          : { opacity: 0 }
      }
    >
      {children}
    </div>
  );
}
