export type ImageInfo = {
  id: string;
  characterId: string;
  characterName: string;
  chatId: string;
  chatName: string;
  url: string;
  alt: string;
  order: number;
};

export type CharacterInfo = {
  id: string;
  name: string;
  chatId: string;
  chatName: string;
  isNew?: boolean;
};

export type ChatGroup = {
  id: string;
  name: string;
  characters: CharacterInfo[];
  hasNewItems?: boolean;
  order?: number;
  updatedAt?: number;
};
