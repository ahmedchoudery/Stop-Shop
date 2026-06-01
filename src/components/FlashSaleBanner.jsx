/**
 * @fileoverview FlashSaleBanner — Dismissible top announcement bar with live countdown.
 * Pulls the store announcement from /api/public/settings.
 * Animates in from the top on mount using the .flash-banner CSS class.
 * Dismissal is persisted to sessionStorage so it stays hidden during a session.
 *
 * Applies: design-spells (micro-animation, countdown pulse), react-ui-patterns (conditional render)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Zap, Clock } from 'lucide-react';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'stopshop-banner-dismissed';

/**
 * Returns seconds until midnight (PKT = UTC+5).
 */
const secondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
};

const formatCountdown = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
};

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const FlashSaleBanner = () => {
  const [announcement, setAnnouncement] = useState('');
  const [dismissed,    setDismissed]    = useState(false);
  const [secondsLeft,  setSecondsLeft]  = useState(secondsUntilMidnight());
  const timerRef = useRef(null);

  // ── Check if dismissed this session ─────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

  // ── Fetch announcement from settings ────────────────────────
  useEffect(() => {
    if (dismissed) return;
    (async () => {
      try {
        const res  = await fetch(apiUrl('/api/public/settings'));
        const data = await res.json();
        const msg  = data?.announcement?.trim();
        if (msg && msg.toLowerCase() !== 'welcome to stop & shop') {
          setAnnouncement(msg);
        }
      } catch {
        // Silently ignore — banner simply won't show
      }
    })();
  }, [dismissed]);

  // ── Live countdown ───────────────────────────────────────────
  useEffect(() => {
    if (dismissed) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          // Reset to next midnight when countdown finishes
          return secondsUntilMidnight();
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  }, []);

  // Only render if there's a meaningful custom announcement
  if (dismissed || !announcement) return null;

  return (
    <div
      className="flash-banner fixed top-0 left-0 w-full z-[200] bg-[#ba1f3d] text-white"
      style={{ height: '36px' }}
      role="banner"
      aria-label="Flash sale announcement"
    >
      <div className="h-full max-w-[1440px] mx-auto px-4 flex items-center justify-between">

        {/* Left spacer to center content */}
        <div className="hidden sm:flex items-center space-x-1.5 opacity-0 pointer-events-none w-20" aria-hidden="true">
          <Zap size={11} />
        </div>

        {/* Center — announcement + countdown */}
        <div className="flex-grow flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Zap size={11} className="fill-white opacity-80 flex-shrink-0" />
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/95 truncate">
              {announcement}
            </p>
          </div>

          {/* Divider */}
          <span className="h-3 w-px bg-white/30 hidden sm:block" aria-hidden="true" />

          {/* Countdown */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <Clock size={10} className="text-white/70 flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
              Ends in
            </span>
            <span
              className="flash-countdown text-[9px] font-black tabular-nums text-white bg-white/20 px-1.5 py-0.5"
              aria-live="polite"
              aria-label={`Time remaining: ${formatCountdown(secondsLeft)}`}
            >
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss announcement"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
