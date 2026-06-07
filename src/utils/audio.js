/**
 * @fileoverview audio.js — Programmatic UI Sound Synthesizer
 * Uses native Web Audio API for zero-latency, asset-free tactile chimes.
 */

let audioCtx = null;

/**
 * Synthesizes a soft organic leather-like snap/chime feedback.
 */
export const playPremiumChime = () => {
  try {
    if (typeof window === 'undefined') return;

    // Lazily initialize AudioContext to comply with browser autoplay policies
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Warm, low-frequency organic wooden tap settings
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, audioCtx.currentTime); // starting frequency
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.12); // fast pitch drop

    // Rapid envelope: zero-latency attack, exponential release decay
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    console.warn('Web Audio synthesis is blocked or unsupported:', err);
  }
};
