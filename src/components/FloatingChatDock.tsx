import React, { useState, useEffect } from 'react';
import { ActiveChatWindowState, User, ChatMessage, Wish, Offer } from '../types';
import { FloatingChatWindow } from './FloatingChatWindow';

interface FloatingChatDockProps {
  openWindows: ActiveChatWindowState[];
  currentUser: User | null;
  allUsers: Record<string, User>;
  wishes?: Wish[];
  offers?: Offer[];
  chats: Record<string, ChatMessage[]>;
  onCloseWindow: (wishId: string) => void;
  onMinimizeWindow: (wishId: string) => void;
  onRestoreWindow: (wishId: string) => void;
  onFocusWindow: (wishId: string) => void;
  onMoveWindow: (wishId: string, pos: { x: number; y: number }) => void;
  onResetWindowPosition: (wishId: string) => void;
  onSendMessage: (wishId: string, text: string, images?: string[], senderOverride?: User) => void;
  onSwitchUser: (user: User) => void;
  onViewUserProfile?: (userId: string, userFallback?: { id: string; name: string; avatar?: string }) => void;
  onViewWish?: (wishId: string) => void;
  onEditOffer?: (offer: Offer) => void;
}

export const FloatingChatDock: React.FC<FloatingChatDockProps> = ({
  openWindows,
  currentUser,
  allUsers,
  wishes = [],
  offers = [],
  chats,
  onCloseWindow,
  onMinimizeWindow,
  onRestoreWindow,
  onFocusWindow,
  onMoveWindow,
  onResetWindowPosition,
  onSendMessage,
  onSwitchUser,
  onViewUserProfile,
  onViewWish,
  onEditOffer,
}) => {
  // Track viewport width for responsive dock layout
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentUser || currentUser.isAdmin || openWindows.length === 0) {
    return null;
  }

  const isSmallScreen = windowWidth < 640;
  const isMobileNavVisible = windowWidth < 768;

  // Calculate side-by-side right offsets for docked windows (those without custom drag position)
  let accumulatedRight = isSmallScreen ? 8 : 16;
  const dockStylesMap: Record<string, React.CSSProperties> = {};

  openWindows.forEach((win) => {
    if (win.position && !isSmallScreen) {
      // Manually dragged window on tablet/desktop - handled by window coordinates
      return;
    }

    if (isSmallScreen && !win.isMinimized) {
      // On mobile phones, expanded chat opens as a clean bottom sheet
      dockStylesMap[win.target.wishId] = {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      };
      return;
    }

    const currentWinWidth = win.isMinimized
      ? (isSmallScreen ? 240 : 320)
      : (isSmallScreen ? Math.min(windowWidth - 16, 400) : 400);

    // If accumulated right exceeds available space on smaller screens, clamp with safe margin
    const effectiveRight = isSmallScreen
      ? Math.max(8, Math.min(accumulatedRight, windowWidth - currentWinWidth - 8))
      : accumulatedRight;

    dockStylesMap[win.target.wishId] = {
      position: 'fixed',
      bottom: isMobileNavVisible ? '60px' : 0,
      right: `${effectiveRight}px`,
    };

    // Increment right offset for the next docked window
    accumulatedRight += currentWinWidth + (isSmallScreen ? 8 : 14);
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {openWindows.map((win) => {
        const wishId = win.target.wishId;
        const messages = chats[wishId] || [];

        return (
          <div key={wishId} className="pointer-events-auto">
            <FloatingChatWindow
              target={win.target}
              currentUser={currentUser}
              allUsers={allUsers}
              wishes={wishes}
              offers={offers}
              messages={messages}
              isMinimized={win.isMinimized}
              zIndex={win.zIndex}
              position={win.position}
              dockStyle={dockStylesMap[wishId]}
              onClose={() => onCloseWindow(wishId)}
              onMinimize={() => onMinimizeWindow(wishId)}
              onRestore={() => onRestoreWindow(wishId)}
              onFocus={() => onFocusWindow(wishId)}
              onMove={(pos) => onMoveWindow(wishId, pos)}
              onResetPosition={() => onResetWindowPosition(wishId)}
              onSendMessage={onSendMessage}
              onSwitchUser={onSwitchUser}
              onViewUserProfile={onViewUserProfile}
              onViewWish={onViewWish}
              onEditOffer={onEditOffer}
            />
          </div>
        );
      })}
    </div>
  );
};
