import React from 'react';

export function RooznamButterfly({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Left wings */}
      <path
        d="M15 15C12.2 10.5 6.5 7 3.8 10C1.8 12.2 4.2 17 8.5 18.2C6 19.6 5.2 23 7.5 24.4C9.9 25.8 13.6 22.8 15.2 18.8"
        fill="#d91b7e"
      />
      {/* Right wings */}
      <path
        d="M17 15C19.8 10.5 25.5 7 28.2 10C30.2 12.2 27.8 17 23.5 18.2C26 19.6 26.8 23 24.5 24.4C22.1 25.8 18.4 22.8 16.8 18.8"
        fill="#a855f7"
      />
      {/* Wing inner accents */}
      <circle cx="8.5" cy="13.2" r="1.7" fill="#fbcfe8" />
      <circle cx="23.5" cy="13.2" r="1.7" fill="#f5d0fe" />
      {/* Body */}
      <rect x="15.1" y="11" width="1.8" height="10.5" rx="0.9" fill="#38035e" />
      {/* Antennae */}
      <path
        d="M15.5 11.2C14.8 9.2 13.5 8 12.5 7.8M16.5 11.2C17.2 9.2 18.5 8 19.5 7.8"
        stroke="#38035e"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RooznamLogo({
  size = 'md',
  variant = 'header',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'header' | 'footer';
}) {
  if (variant === 'footer') {
    return (
      <span className="inline-flex items-center select-none">
        <img
          src="/src/assets/images/rooznam-footer-logo.png"
          alt="Rooznam — Little Styles, Big Smiles."
          className="h-24 sm:h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          decoding="async"
        />
      </span>
    );
  }

  const heightClass =
    size === 'sm'
      ? 'h-7 sm:h-9'
      : size === 'lg'
        ? 'h-10 sm:h-12'
        : 'h-8 sm:h-11';

  return (
    <span className="inline-flex items-center select-none leading-none">
      <img
        src="/src/assets/images/rooznam-logo.png"
        alt="Rooznam"
        className={`${heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]`}
        decoding="async"
      />
    </span>
  );
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16.004c0 2.353.615 4.651 1.784 6.675L2.56 29.333l6.824-1.79a13.28 13.28 0 006.62 1.794h.005c7.363 0 13.337-5.974 13.337-13.333 0-3.562-1.387-6.912-3.906-9.431a13.255 13.255 0 00-9.436-3.906zm7.768 18.899c-.327.921-1.912 1.762-2.647 1.872-.678.101-1.535.143-2.478-.156-.571-.182-1.304-.425-2.244-.831-3.949-1.706-6.528-5.687-6.726-5.95-.196-.263-1.605-2.135-1.605-4.072 0-1.937 1.015-2.89 1.375-3.283.36-.394.787-.492 1.049-.492.263 0 .524.003.754.014.242.012.566-.092.885.676.327.788 1.114 2.725 1.213 2.922.098.197.164.426.033.689-.131.263-.197.427-.394.656-.197.23-.414.513-.59.689-.197.197-.402.41-.173.804.23.394 1.02 1.683 2.19 2.726 1.504 1.341 2.773 1.757 3.167 1.954.394.197.623.164.853-.098.23-.263.984-1.148 1.247-1.542.262-.394.525-.328.885-.197.361.131 2.297 1.083 2.69 1.28.394.197.656.295.755.46.098.163.098.951-.23 1.872z" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}
