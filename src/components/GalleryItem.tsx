import { useState } from 'react';
import { ImageInfo } from '../types';
import { ImageOff } from 'lucide-react';

type GalleryItemProps = {
  key?: string | number;
  image: ImageInfo;
  onClick: () => void;
};

export default function GalleryItem({ image, onClick }: GalleryItemProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div 
      className={`relative group cursor-zoom-in w-full rounded-[12px] overflow-hidden bg-[#1A1616] break-inside-avoid border border-transparent hover:border-[#CFA7A0]/30 transition-all duration-[600ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:shadow-[0_8px_30px_rgb(207,167,160,0.1)] h-full hover:scale-[1.03] ${(hasError || !isLoaded) ? 'aspect-[4/5]' : ''}`}
      onClick={onClick}
    >
      {(!isLoaded && !hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2A2424]/40 overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#F4EFE7]/5 to-transparent animate-[shimmer_2s_infinite]" />
          <div className="w-[30px] h-[30px] border-[1.5px] border-[#8D9B87]/20 border-t-[#8D9B87]/80 rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8D9B87] opacity-40 gap-3 p-6 text-center bg-[#2A2424]/40">
          <ImageOff strokeWidth={1} className="w-6 h-6" />
          <span className="text-[10px] uppercase tracking-widest leading-relaxed">Image<br/>Unavailable</span>
        </div>
      )}

      {(!hasError) && (
        <>
          <img
            src={image.url}
            alt={image.alt || image.characterName}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full object-cover transition-all duration-1000 ease-out transform h-full absolute inset-0 ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-110'}`}
          />
        </>
      )}
    </div>
  );
}

