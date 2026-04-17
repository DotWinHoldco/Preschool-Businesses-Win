'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  src1080: string;
  src720: string;
  poster: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: string;
}

export function VideoBackground({
  src1080,
  src720,
  poster,
  className = '',
  children,
  overlay = 'bg-black/30',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!prefersReducedMotion ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={src1080} type="video/mp4" media="(min-width: 768px)" />
          <source src={src720} type="video/mp4" />
        </video>
      ) : (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
