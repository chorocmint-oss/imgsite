/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useContent } from './lib/content';
import Sidebar from './components/Sidebar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';
import Admin from './pages/Admin';

export default function App() {
  const { images, chatGroups } = useContent();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredImages = useMemo(() => {
    if (!selectedId) return images.slice(0, 10);
    return images.filter(img => img.characterId === selectedId || img.chatId === selectedId);
  }, [selectedId, images]);

  const galleryInfo = useMemo(() => {
    if (!selectedId) {
      return {
        title: "Character Archive"
      };
    }
    
    for (const chat of chatGroups) {
      if (chat.id === selectedId) {
        return {
          title: chat.name,
          description: `Visual archive for ${chat.name}`
        };
      }
      const char = chat.characters.find(c => c.id === selectedId);
      if (char) {
        return {
          title: char.name,
          description: `Visual archive for ${char.name} in ${chat.name}`
        };
      }
    }

    return { title: undefined, description: undefined };
  }, [selectedId, chatGroups]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const nextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/" element={
        <div className="flex flex-col md:flex-row min-h-screen bg-[#111111] text-[#F4EFE7] font-sans selection:bg-[#CFA7A0]/30 selection:text-white overflow-hidden md:overflow-auto">
          <Sidebar
            chatGroups={chatGroups}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          
          <main className="flex-1 md:ml-[240px] w-full relative min-h-screen">
            <Gallery 
              images={filteredImages} 
              title={galleryInfo.title}
              description={galleryInfo.description}
              onImageClick={openLightbox} 
            />
          </main>

          {lightboxIndex !== null && (
            <Lightbox 
              image={filteredImages[lightboxIndex]}
              hasNext={lightboxIndex < filteredImages.length - 1}
              hasPrev={lightboxIndex > 0}
              onClose={closeLightbox}
              onNext={nextImage}
              onPrev={prevImage}
            />
          )}
        </div>
      } />
    </Routes>
  );
}
