import { useState } from 'react';
import { LayoutGrid, GalleryVertical } from 'lucide-react';
import { ImageInfo } from '../types';
import GalleryItem from './GalleryItem';

type GalleryProps = {
  images: ImageInfo[];
  title?: string;
  description?: string;
  onImageClick: (index: number) => void;
};

export default function Gallery({ images, title, description, onImageClick }: GalleryProps) {
  const [layout, setLayout] = useState<'masonry' | 'grid'>('masonry');
  const displayTitle = title || "Character Archive";

  const renderHeader = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 mt-4 md:mt-0 gap-4 md:gap-8">
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#E8E2D9] via-[#CFA7A0] to-[#E8E2D9] bg-[length:200%_auto] animate-text-panning tracking-[0.04em] leading-none mb-0">
            {displayTitle}
          </h2>
        </div>
        
        <div className="flex items-start gap-2 bg-[#2A2424]/30 rounded-full p-1.5 border border-[#8D9B87]/20 shrink-0">
          <button 
            onClick={() => setLayout('masonry')}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${layout === 'masonry' ? 'bg-[#CFA7A0]/20 text-[#CFA7A0]' : 'text-[#8D9B87]/60 hover:text-[#8D9B87]'}`}
            title="Masonry Layout"
          >
            <GalleryVertical className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setLayout('grid')}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${layout === 'grid' ? 'bg-[#CFA7A0]/20 text-[#CFA7A0]' : 'text-[#8D9B87]/60 hover:text-[#8D9B87]'}`}
            title="Grid Layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {description && (
        <p className="text-[13px] leading-relaxed tracking-[0.05em] text-[#8D9B87] opacity-60 mb-[24px] max-w-2xl">
          {description}
        </p>
      )}
    </>
  );

  if (images.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-screen p-8 md:px-[64px] md:py-12 max-w-[1800px] mx-auto">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center flex-1 text-[#8D9B87] opacity-40 tracking-widest text-[12px] uppercase font-light">
          No images archived
        </div>
        <div className="mt-auto pt-6 border-t border-[#F4EFE7]/[0.05] flex justify-between items-center text-[10px] uppercase tracking-[0.1em] opacity-40 text-[#F4EFE7]">
          <span>Latest Gallery Archive</span>
          <span>Curated by florette</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen p-8 md:px-[64px] md:py-12 max-w-[1800px] mx-auto">
      {renderHeader()}

      <div className={
        layout === 'masonry' 
          ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-[32px] flex-1"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[32px] flex-1 auto-rows-[300px]"
      }>
        {images.map((img, idx) => (
          <GalleryItem 
            key={img.id} 
            image={img} 
            layout={layout}
            onClick={() => onImageClick(idx)} 
          />
        ))}
      </div>
      
    </div>
  );
}
