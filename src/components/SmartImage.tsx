import React, { useState } from 'react';
import { RooznamButterfly } from './Icons';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function SmartImage({ src, alt, className = '', priority = false }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#faf5fd] to-[#f1e6f8] text-[#55157e] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <RooznamButterfly className="w-8 h-8 text-[#d91b7e]/60 mb-2" />
        <span className="text-xs font-semibold text-[#38035e]/80 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f7f2fa]">
      {!loaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#faf5fd] via-[#f2e8f9] to-[#faf5fd] animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
