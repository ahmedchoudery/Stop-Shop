import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

/**
 * ProductLightbox
 * Props:
 *  - images: [{ src, alt, label }] — array of all images to display
 *  - startIndex: number — which image to open on
 *  - isOpen: bool
 *  - onClose: fn
 */
const ProductLightbox = ({ images = [], startIndex = 0, isOpen, onClose }) => {
    const [current, setCurrent] = useState(startIndex);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrent(startIndex);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setIsLoaded(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, startIndex]);

    // Reset zoom/pan when switching images
    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsLoaded(false);
    }, [current]);

    // Keyboard nav
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, current, zoom]);

    const next = useCallback(() => {
        setCurrent(c => (c + 1) % images.length);
    }, [images.length]);

    const prev = useCallback(() => {
        setCurrent(c => (c - 1 + images.length) % images.length);
    }, [images.length]);

    const zoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
    const zoomOut = () => {
        setZoom(z => {
            const newZ = Math.max(z - 0.5, 1);
            if (newZ === 1) setPan({ x: 0, y: 0 });
            return newZ;
        });
    };

    // Drag to pan when zoomed
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

    // Double-click to toggle zoom
    const onDblClick = () => {
        if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
        else setZoom(2);
    };

    if (!isOpen || images.length === 0) return null;

    const img = images[current];

    return (
        <div className="fixed inset-0 z-[400] flex flex-col bg-black">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm flex-shrink-0 z-10">
                <div className="flex items-center space-x-4">
                    <span className="text-white/40 text-[11px] font-black uppercase tracking-widest">
                        {current + 1} / {images.length}
                    </span>
                    {img.label && (
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{img.label}</span>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={zoomOut}
                        disabled={zoom <= 1}
                        className="p-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all text-white"
                        title="Zoom out (−)"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-white/50 text-xs font-black w-12 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={zoom >= 4}
                        className="p-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all text-white"
                        title="Zoom in (+)"
                    >
                        <ZoomIn size={18} />
                    </button>

                    <div className="w-px h-6 bg-white/20 mx-1" />

                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/10 hover:bg-red-600 rounded-xl transition-all text-white"
                        title="Close (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main Image Area */}
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
                        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Image */}
                <div className="relative w-full h-full flex items-center justify-center p-8">
                    {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                    <img
                        ref={imgRef}
                        src={img.src}
                        alt={img.alt || 'Product image'}
                        onLoad={() => setIsLoaded(true)}
                        className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                            transition: isDragging ? 'none' : 'transform 0.25s ease',
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
                        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Zoom hint */}
                {zoom === 1 && isLoaded && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-black uppercase tracking-widest pointer-events-none">
                        Double-click or use +/− to zoom
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="flex-shrink-0 py-4 px-6 bg-black/80 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-3 overflow-x-auto">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === current
                                        ? 'border-red-500 scale-105 shadow-lg shadow-red-900/50'
                                        : 'border-white/10 hover:border-white/30 opacity-50 hover:opacity-100'
                                    }`}
                            >
                                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div className="flex-shrink-0 pb-3 flex justify-center">
                <div className="flex items-center space-x-4 text-white/20 text-[9px] font-black uppercase tracking-widest">
                    <span>← → Navigate</span>
                    <span>· + − Zoom</span>
                    <span>· Esc Close</span>
                    <span>· Double-click Toggle Zoom</span>
                </div>
            </div>
        </div>
    );
};

export default ProductLightbox;