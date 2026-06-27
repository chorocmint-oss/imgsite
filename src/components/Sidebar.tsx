import { useState, useEffect } from 'react';
import { ChevronDown, Minus } from 'lucide-react';
import { ChatGroup } from '../types';

type SidebarProps = {
  chatGroups: ChatGroup[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function Sidebar({ chatGroups, selectedId, onSelect }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    chatGroups.forEach(g => {
      initial[g.id] = false;
    });
    return initial;
  });

  // If a character or group is selected, ensure their group is expanded
  useEffect(() => {
    if (selectedId) {
      const group = chatGroups.find(g => g.id === selectedId || g.characters.some(c => c.id === selectedId));
      if (group) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
      }
    }
  }, [selectedId, chatGroups]);

  const toggleGroup = (groupId: string) => {
    const isCurrentlySelected = selectedId === groupId;
    
    // Auto collapse logic inside toggling could be optional, but here we just expand/collapse it
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));

    // If it's not currently selected, select it as we open it
    if (!isCurrentlySelected) {
      onSelect(groupId);
    }
  };

  return (
    <aside className="w-full md:w-[240px] shrink-0 md:fixed md:h-screen border-b md:border-b-0 md:border-r border-[#F4EFE7]/[0.05] px-8 py-12 flex flex-col z-20 bg-[#111111]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none sticky top-0 md:overflow-y-auto scrollbar-none">
      <div>
        <h1 
          className="flex items-center gap-[10px] text-[22px] tracking-[0.1em] font-serif font-normal cursor-pointer mb-[16px] md:mt-[8px] group leading-none"
          onClick={() => onSelect(null)}
        >
          <div className="w-[5px] h-[5px] border-[1px] border-[#CFA7A0] rotate-45 transition-transform duration-700 ease-out group-hover:rotate-[225deg]" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8E2D9] via-[#CFA7A0] to-[#E8E2D9] bg-[length:200%_auto] animate-text-panning opacity-90 transition-opacity group-hover:opacity-100">Florette</span>
        </h1>
        <div className="w-full h-px bg-[#F4EFE7]/10 mb-[24px]" />
      </div>

      <nav className="flex-1 flex flex-col gap-10">
        <div>
          <button
            onClick={() => onSelect(null)}
            className={`relative flex items-center w-full ml-[20px] text-[12px] uppercase tracking-[0.2em] transition-all duration-500 ease-out hover:translate-x-1 text-left bg-transparent group ${
              selectedId === null ? 'text-[#CFA7A0] opacity-100 font-medium' : 'text-[#F4EFE7] opacity-60 hover:opacity-100 font-normal'
            }`}
          >
            {selectedId === null && (
              <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-[1px] h-[14px] bg-[#CFA7A0] z-10" />
            )}
            <span className="flex items-center gap-2">
              Latest
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {chatGroups.map(chat => {
            const isExpanded = expandedGroups[chat.id];
            
            return (
              <div key={chat.id}>
                {chat.characters.length <= 1 ? (
                  <button 
                    onClick={() => {
                      if (chat.characters.length === 1) {
                        chat.characters[0].isNew = false;
                        chat.hasNewItems = false;
                        onSelect(chat.characters[0].id);
                      } else {
                        onSelect(chat.id);
                      }
                    }}
                    className={`relative flex items-center w-full text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-500 text-left bg-transparent group mb-2 ${
                      (selectedId === chat.id || (chat.characters.length === 1 && selectedId === chat.characters[0].id)) ? 'text-[#CFA7A0] opacity-100' : 'text-[#8D9B87] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="w-[20px] flex justify-start items-center shrink-0">
                      <ChevronDown strokeWidth={1.5} className="w-3 h-3 transition-transform duration-300 -rotate-90" />
                    </span>
                    <span className="flex items-center gap-2">
                      {chat.name}
                      {chat.hasNewItems && <span className="w-1.5 h-1.5 rounded-full bg-[#CFA7A0]/70 shrink-0" title="New image added" />}
                    </span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => toggleGroup(chat.id)}
                      className={`relative flex items-center w-full text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-500 text-left bg-transparent group mb-2 ${
                        selectedId === chat.id ? 'text-[#CFA7A0] opacity-100' : 'text-[#8D9B87] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="w-[20px] flex justify-start items-center shrink-0">
                        <ChevronDown strokeWidth={1.5} className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                      </span>
                      <span className="flex items-center gap-2">
                        {chat.name}
                        {chat.hasNewItems && !isExpanded && <span className="w-1.5 h-1.5 rounded-full bg-[#CFA7A0]/70 shrink-0" title="New image added" />}
                      </span>
                    </button>
                    
                    <div className={`grid transition-all duration-500 overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <ul className="flex flex-col gap-[18px] min-h-0 relative">
                        {/* Visual guide line */}
                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[#8D9B87]/20" />
                        
                        {chat.characters.map((char, idx) => (
                          <li key={char.id} className={idx === 0 ? "pt-1" : ""}>
                            <button
                              onClick={() => {
                                char.isNew = false;
                                chat.hasNewItems = chat.characters.some(c => c.isNew);
                                onSelect(char.id);
                              }}
                              className={`relative flex items-center w-full ml-5 text-[11px] tracking-[0.1em] uppercase transition-all duration-500 ease-out hover:translate-x-1 ${
                                selectedId === char.id ? 'text-[#CFA7A0] opacity-100 font-medium' : 'text-[#F4EFE7] opacity-60 hover:opacity-100 font-normal'
                              }`}
                            >
                              {selectedId === char.id && (
                                <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-[1px] h-[12px] bg-[#CFA7A0] z-10" />
                              )}
                              <span className="flex items-center gap-2">
                                {char.name}
                                {char.isNew && <span className="w-1.5 h-1.5 rounded-full bg-[#CFA7A0]/70 shrink-0" title="New image added" />}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </nav>
      
      <div className="hidden md:block mt-20 text-[10px] uppercase tracking-[0.1em] text-[#8D9B87] opacity-40 ml-4">
        © florette archive
      </div>
    </aside>
  );
}
