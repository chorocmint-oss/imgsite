import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageInfo } from '../types';

type LightboxProps = {
  image: ImageInfo;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({ image, hasPrev, hasNext, onClose, onPrev, onNext }: LightboxProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [hasPrev, hasNext, onClose, onNext, onPrev]);

  const handleDragEnd = (_e: any, { offset, velocity }: any) => {
    const swipeThresh = 40;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (offset.x > swipeThresh || swipePower > 500) {
      if (hasPrev) onPrev();
    } else if (offset.x < -swipeThresh || swipePower < -500) {
      if (hasNext) onNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-[#0A0A0A]/98"
        onClick={onClose}
      />

      <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={image.id}
            src={image.url}
            alt={image.alt || image.characterName}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            className="w-full h-full md:max-h-[85vh] object-contain md:rounded-xl shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>

        {image.alt && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-[#F4EFE7]/70 text-xs tracking-wider px-6 py-3 bg-[#111111]/40 rounded-full backdrop-blur-md pointer-events-none font-light"
          >
            {image.alt}
          </motion.div>
        )}
      </div>

      <button 
        className="absolute top-6 right-6 md:top-10 md:right-10 p-3 rounded-full bg-transparent hover:bg-[#2A2424]/50 transition-colors pointer-events-auto z-10 opacity-40 hover:opacity-100"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X strokeWidth={1} className="w-7 h-7 text-[#F4EFE7]" />
      </button>

      {hasPrev && (
        <button 
          className="absolute left-4 md:left-12 p-3 md:p-5 rounded-full bg-transparent hover:bg-[#2A2424]/20 transition-all pointer-events-auto z-10 opacity-30 hover:opacity-100 hidden sm:block"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <ChevronLeft strokeWidth={1} className="w-10 h-10 text-[#F4EFE7]" />
        </button>
      )}

      {hasNext && (
        <button 
          className="absolute right-4 md:right-12 p-3 md:p-5 rounded-full bg-transparent hover:bg-[#2A2424]/20 transition-all pointer-events-auto z-10 opacity-30 hover:opacity-100 hidden sm:block"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <ChevronRight strokeWidth={1} className="w-10 h-10 text-[#F4EFE7]" />
        </button>
      )}

      {/* Keyboard navigation hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:-translate-x-0 md:bottom-8 md:right-10 flex items-center gap-1.5 text-[10px] tracking-[0.05em] font-sans text-[#F4EFE7] opacity-80 pointer-events-none hidden sm:flex z-10">
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[3px] bg-[#2A2424] border border-[#CFA7A0]/30 text-[#CFA7A0]">←</span>
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[3px] bg-[#2A2424] border border-[#CFA7A0]/30 text-[#CFA7A0]">→</span>
        <span className="ml-1 opacity-80">Navigate</span>
        <span className="mx-2 opacity-50">•</span>
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[3px] bg-[#2A2424] border border-[#CFA7A0]/30 text-[#CFA7A0]">Esc</span>
        <span className="ml-1 opacity-80">Close</span>
      </div>
    </div>
  );
}
