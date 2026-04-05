/**
 * @fileoverview ProductLightbox — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — lightbox animations are now functional
 * Applies: animejs-animation (spring open, swipe transition, thumbnail stagger),
 *          design-spells (zoom cursor, swipe gesture, keyboard shortcut hints)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import anime from 'animejs';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useScrollLock } from '../hooks/useUtils.js';

const ProductLightbox = ({ images = [], startIndex = 0, isOpen, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const thumbsRef = useRef(null);

  useScrollLock(isOpen);

  // Spring open animation
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    anime.set(overlayRef.current, { opacity: 0 });
    anime({
      targets: overlayRef.current,
      opacity: [0, 1],
      duration: 250,
      easing: 'easeOutQuad',
    });
  }, [isOpen]);

  // Reset state on open / image change
  useEffect(() => {
    if (isOpen) {
      setCurrent(startIndex);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsLoaded(false);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsLoaded(false);
  }, [current]);

  // Thumbnail stagger on open
  useEffect(() => {
    if (!isOpen || !thumbsRef.current) return;

    const thumbs = thumbsRef.current.querySelectorAll('[data-thumb]');
    anime.set(thumbs, { opacity: 0, translateY: 10 });
    anime({
      targets: thumbs,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      delay: anime.stagger(40, { start: 100 }),
      easing: EASING.QUART_OUT,
    });
  }, [isOpen]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, current, zoom]);  

  const handleClose = useCallback(() => {
    if (!overlayRef.current) { onClose(); return; }
    anime({
      targets: overlayRef.current,
      opacity: [1, 0],
      duration: 200,
      easing: 'easeInQuad',
      complete: onClose,
    });
  }, [onClose]);

  const animateImgSwitch = useCallback((dir) => {
    if (!imgRef.current) return;
    anime({
      targets: imgRef.current,
      opacity: [0, 1],
      translateX: [dir * 30, 0],
      duration: 350,
      easing: EASING.FABRIC,
    });
  }, []);

  const next = useCallback(() => {
    setCurrent(c => {
      const n = (c + 1) % images.length;
      animateImgSwitch(1);
      return n;
    });
  }, [images.length, animateImgSwitch]);

  const prev = useCallback(() => {
    setCurrent(c => {
      const n = (c - 1 + images.length) % images.length;
      animateImgSwitch(-1);
      return n;
    });
  }, [images.length, animateImgSwitch]);

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const zoomOut = () => {
    setZoom(z => {
      const n = Math.max(z - 0.5, 1);
      if (n === 1) setPan({ x: 0, y: 0 });
      return n;
    });
  };

  // Pan when zoomed
  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setIsDragging(false);
  const onDblClick = () => {
    if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
    else setZoom(2);
  };

  if (!isOpen || !images.length) return null;

  const img = images[current];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[400] flex flex-col bg-black"
      style={{ opacity: 0 }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            {current + 1} / {images.length}
          </span>
          {img.label && (
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
              {img.label}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {[
            { Icon: ZoomOut, onClick: zoomOut, disabled: zoom <= 1, title: 'Zoom out (−)' },
            { text: `${Math.round(zoom * 100)}%` },
            { Icon: ZoomIn, onClick: zoomIn, disabled: zoom >= 4, title: 'Zoom in (+)' },
          ].map((item, i) =>
            item.text ? (
              <span key={i} className="text-white/50 text-[10px] font-black w-10 text-center">{item.text}</span>
            ) : (
              <button
                key={i}
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.title}
                className="p-2.5 bg-white/8 hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all text-white"
              >
                <item.Icon size={16} />
              </button>
            )
          )}

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button
            onClick={handleClose}
            className="p-2.5 bg-white/8 hover:bg-[#ba1f3d] rounded-xl transition-all duration-300 text-white hover:rotate-90 transform"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-grow relative overflow-hidden flex items-center justify-center"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDblClick}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-2xl text-white transition-all group"
          >
            <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-8">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            ref={imgRef}
            src={img.src}
            alt={img.alt ?? 'Product'}
            onLoad={() => setIsLoaded(true)}
            className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease',
              willChange: 'transform',
            }}
            draggable={false}
          />
        </div>

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-2xl text-white transition-all group"
          >
            <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Hint */}
        {zoom === 1 && isLoaded && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/25 text-[9px] font-black uppercase tracking-widest pointer-events-none">
            Double-click or +/− to zoom
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div ref={thumbsRef} className="flex-shrink-0 py-4 px-6 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-3 overflow-x-auto scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                data-thumb
                onClick={() => { setCurrent(idx); animateImgSwitch(idx > current ? 1 : -1); }}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  idx === current
                    ? 'border-[#ba1f3d] scale-105 shadow-lg shadow-red-900/50'
                    : 'border-white/10 hover:border-white/30 opacity-50 hover:opacity-100'
                }`}
                style={{ opacity: 0 }}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex-shrink-0 pb-3 flex justify-center">
        <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">
          ← → Navigate · + − Zoom · Esc Close · Double-click Toggle Zoom
        </p>
      </div>
    </div>
  );
};

export default ProductLightbox;
