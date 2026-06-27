/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { ImageInfo, CharacterInfo, ChatGroup } from '../types';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const mdFiles = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default', eager: true });

function parseContent(files: { path: string; content: string; updatedAt?: number }[]) {
  const images: ImageInfo[] = [];
  const chatsMap = new Map<string, ChatGroup>();

  for (const file of files) {
    const rawContent = file.content;
    const path = file.path;
    const updatedAt = file.updatedAt || 0;
    const parts = path.split('/');
    
    // e.g., '/content/ChatName/Subfolder/char.md' -> ['', 'content', 'ChatName', 'Subfolder', 'char.md']
    // For firestore, it might just be 'ChatName/char.md'
    const filename = parts.pop() || '';
    let folderName = 'Uncategorized';

    // If it starts with /content/, the folder is parts[2]
    if (parts[0] === '' && parts[1] === 'content' && parts.length > 2) {
      folderName = parts[2];
    } else if (parts.length > 0 && parts[0] !== '' && parts[0] !== 'content') {
      // For firestore paths like 'ChatName/char.md' -> parts is ['ChatName']
      folderName = parts[0];
    } else if (parts.length === 0) {
      folderName = filename.replace(/\.md$/, '');
    }

    let folderOrder = 999;
    let cleanFolderName = folderName;
    const match = folderName.match(/^(\d+)[-_ ]+(.*)$/);
    if (match) {
      folderOrder = parseInt(match[1], 10);
      cleanFolderName = match[2];
    }

    const chatId = folderName;
    const chatName = decodeURIComponent(cleanFolderName).replace(/[-_]/g, ' ');

    const characterId = `${chatId}-${filename.replace(/\.md$/, '')}`;
    
    let currentCharacterName = filename.replace(/\.md$/, '');
    currentCharacterName = currentCharacterName.charAt(0).toUpperCase() + currentCharacterName.slice(1);

    let orderInFile = 0;
    const lines = rawContent.split('\n');

    for (const line of lines) {
      const headingMatch = line.match(/^\s*#\s+(.+)$/);
      if (headingMatch) {
        currentCharacterName = headingMatch[1].trim();
        continue;
      }

      const imgMatches = Array.from(line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
      for (const imgMatch of imgMatches) {
        images.push({
          id: `${characterId}-${orderInFile}`,
          characterId,
          characterName: currentCharacterName,
          chatId,
          chatName,
          alt: imgMatch[1].trim(),
          url: imgMatch[2].trim(),
          order: orderInFile,
        });
        orderInFile++;
      }
    }

    if (!chatsMap.has(chatId)) {
      chatsMap.set(chatId, { id: chatId, name: chatName, characters: [], order: folderOrder, updatedAt: updatedAt });
    } else {
      const existing = chatsMap.get(chatId)!;
      if (updatedAt > (existing.updatedAt || 0)) {
        existing.updatedAt = updatedAt;
      }
    }

    const chatGroup = chatsMap.get(chatId)!;
    const existingChar = chatGroup.characters.find(c => c.id === characterId);
    if (!existingChar) {
      chatGroup.characters.push({
        id: characterId,
        name: currentCharacterName,
        chatId,
        chatName
      });
    } else {
      existingChar.name = currentCharacterName;
    }
  }

  const sortedImages = [...images].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.characterId.localeCompare(b.characterId);
  });

  const chatGroups = Array.from(chatsMap.values()).sort((a, b) => {
    if (a.order !== 999 || b.order !== 999) {
      if (a.order !== b.order) return (a.order || 999) - (b.order || 999);
    }
    // If order is not explicitly set (both 999), sort by updatedAt descending
    const updatedA = a.updatedAt || 0;
    const updatedB = b.updatedAt || 0;
    if (updatedA !== updatedB) return updatedB - updatedA;
    return a.name.localeCompare(b.name);
  });
  chatGroups.forEach((chat, index) => {
    chat.hasNewItems = index === 0; 
    chat.characters.sort((a, b) => a.name.localeCompare(b.name));
    if (chat.hasNewItems && chat.characters.length > 0) {
      chat.characters[0].isNew = true;
    }
  });

  return { images: sortedImages, chatGroups };
}

export function useContent() {
  const [data, setData] = useState<{images: ImageInfo[], chatGroups: ChatGroup[]}>({ images: [], chatGroups: [] });

  useEffect(() => {
    const localFiles = Object.keys(mdFiles).map(key => ({
      path: key,
      content: mdFiles[key] as string,
      updatedAt: 0
    }));
    
    // Initial parse of local files
    setData(parseContent(localFiles));

    // Listen to firestore
    const unsubscribe = onSnapshot(collection(db, 'markdowns'), (snapshot) => {
      const fileMap = new Map<string, { path: string; content: string; updatedAt?: number }>();
      
      // Add local files first
      localFiles.forEach(f => fileMap.set(f.path, f));
      
      snapshot.forEach(doc => {
        const docData = doc.data();
        if (docData.path && docData.content) {
          fileMap.set(docData.path, {
            path: docData.path,
            content: docData.content,
            updatedAt: docData.updatedAt || 0
          });
        }
      });
      
      setData(parseContent(Array.from(fileMap.values())));
    }, (error) => {
      console.error("Error fetching firestore content", error);
    });

    return () => unsubscribe();
  }, []);

  return data;
}
