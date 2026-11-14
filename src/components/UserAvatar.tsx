import React, { useState, useEffect } from 'react';
import { User } from '../types';

export interface UserAvatarProps {
  user?: Partial<User> | null;
  src?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  textClassName?: string;
  alt?: string;
  showVerified?: boolean;
}

const SIZE_MAP: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-5 h-5', text: 'text-[9px]' },
  sm: { container: 'w-7 h-7', text: 'text-[11px]' },
  md: { container: 'w-8 h-8', text: 'text-xs' },
  lg: { container: 'w-10 h-10', text: 'text-sm font-bold' },
  xl: { container: 'w-12 h-12', text: 'text-base font-bold' },
  '2xl': { container: 'w-16 h-16', text: 'text-xl font-bold' },
  '3xl': { container: 'w-20 h-20', text: 'text-2xl font-bold' },
};

// Generates 1-2 character uppercase initials from name
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic pleasing background color for user initials
const BG_COLORS = [
  'bg-[#243B64] text-white',
  'bg-[#4F86D9] text-white',
  'bg-[#3568B5] text-white',
  'bg-[#1A2B49] text-white',
  'bg-[#287A55] text-white',
  'bg-[#2E4B7E] text-white',
];

function getBgColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  avatarUrl,
  name,
  size = 'md',
  className = '',
  textClassName = '',
  alt,
  showVerified = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // Resolved source: avatarUrl || avatar || src
  const imageSource = avatarUrl || user?.avatarUrl || user?.avatar || src || null;
  const displayName = name || user?.name || 'User';
  const initials = getInitials(displayName);

  // Reset error state if imageSource changes
  useEffect(() => {
    setHasError(false);
  }, [imageSource]);

  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;
  const isCircle = !className.includes('rounded-');
  const shapeClass = isCircle ? 'rounded-full' : '';

  const hasValidImage = !!imageSource && !hasError;

  return (
    <div className={`relative inline-flex shrink-0 ${sizeStyles.container} ${className}`}>
      {hasValidImage ? (
        <img
          src={imageSource}
          alt={alt || displayName}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover ${shapeClass} ${className}`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-bold tracking-wider select-none ${getBgColor(displayName)} ${shapeClass} ${sizeStyles.text} ${textClassName}`}
          aria-label={displayName}
        >
          {initials}
        </div>
      )}

      {showVerified && user?.verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
          title="Verified Member"
        />
      )}
    </div>
  );
};
