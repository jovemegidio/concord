import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, GripVertical, ChevronRight, ChevronDown,
  CheckSquare, Bell, Calendar, ExternalLink, Upload,
} from 'lucide-react';
import { usePagesStore } from '@/stores';
import { cn } from '@/lib/cn';
import { BlockTypeMenu, BLOCK_TYPE_CONFIG } from './BlockTypeMenu';
import type { Block, ID } from '@/types';

export const BlockRenderer: React.FC<{
  block: Block;
  pageId: ID;
  index: number;
}> = ({ block, pageId, index }) => {
  const {
    updateBlockContent, deleteBlock, addBlock, changeBlockType,
    toggleBlockChecked, toggleBlockCollapsed,
  } = usePagesStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const isLocalEdit = useRef(false);

  useEffect(() => {
    if (contentRef.current && !isLocalEdit.current) {
      contentRef.current.textContent = block.content;
    }
    isLocalEdit.current = false;
  }, [block.id, block.content]);

  const handleInput = useCallback(() => {
    if (contentRef.current) {
      isLocalEdit.current = true;
      updateBlockContent(pageId, block.id, contentRef.current.textContent ?? '');
    }
  }, [pageId, block.id, updateBlockContent]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newId = addBlock(pageId, 'paragraph', block.id);
        setTimeout(() => {
          const newEl = document.querySelector(`[data-block-id="${newId}"]`) as HTMLElement;
          newEl?.focus();
        }, 50);
      }

      if (e.key === 'Backspace' && (contentRef.current?.textContent ?? '') === '') {
        e.preventDefault();
        deleteBlock(pageId, block.id);
      }

      if (e.key === '/' && (contentRef.current?.textContent ?? '') === '') {
        e.preventDefault();
        setShowTypeMenu(true);
        setTypeFilter('');
      }
    },
    [pageId, block.id, addBlock, deleteBlock],
  );

  // Divider block
  if (block.type === 'divider') {
    return (
      <div className="group flex items-center gap-2 py-2 px-1">
        <button
          onClick={() => deleteBlock(pageId, block.id)}
          className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-surface-400 transition-opacity"
        >
          <GripVertical size={14} />
        </button>
        <hr className="flex-1 border-surface-700" />
      </div>
    );
  }

  // Image block
  if (block.type === 'image') {
    return (
      <div className="group flex items-start gap-2 py-1 px-1">
        <button className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-surface-400 mt-1 transition-opacity">
          <GripVertical size={14} />
        </button>
        <div className="flex-1">
          {block.properties.imageUrl ? (
            <img src={block.properties.imageUrl as string} alt="" className="rounded-lg max-h-64 object-cover" />
          ) : (
            <div className="w-full bg-surface-800 border border-dashed border-surface-700 rounded-lg px-4 py-4 space-y-2">
              <div
                contentEditable
                ref={contentRef}
                data-block-id={block.id}
                data-placeholder="Cole a URL da imagem..."
                onInput={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const url = contentRef.current?.textContent?.trim();
                    if (url) {
                      updateBlockContent(pageId, block.id, '');
                      usePagesStore.getState().updateBlockProperties(pageId, block.id, { imageUrl: url });
                    }
                  }
                }}
                className="w-full text-sm text-surface-400 text-center focus:outline-none"
                suppressContentEditableWarning
              />
              <div className="flex justify-center">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-700/50 rounded-lg text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors cursor-pointer">
                  <Upload size={12} />
                  Importar do computador
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) { alert('Arquivo muito grande (máx. 4MB)'); return; }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          updateBlockContent(pageId, block.id, '');
                          usePagesStore.getState().updateBlockProperties(pageId, block.id, { imageUrl: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Reminder block
  if (block.type === 'reminder') {
    const reminderDate = (block.properties.reminderDate as string) || '';
    const reminderTime = (block.properties.reminderTime as string) || '09:00';
    const title = block.content || 'Lembrete';

    const buildGoogleCalUrl = () => {
      if (!reminderDate) return '#';
      const date = reminderDate.replace(/-/g, '');
      const [h, m] = reminderTime.split(':');
      const startDt = `${date}T${h}${m}00`;
      const endH = String(parseInt(h) + 1).padStart(2, '0');
      const endDt = `${date}T${endH}${m}00`;
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${startDt}/${endDt}`,
        details: `Lembrete do Concord: ${title}`,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const buildIcsData = () => {
      if (!reminderDate) return '';
      const date = reminderDate.replace(/-/g, '');
      const [h, m] = reminderTime.split(':');
      const startDt = `${date}T${h}${m}00`;
      const endH = String(parseInt(h) + 1).padStart(2, '0');
      const endDt = `${date}T${endH}${m}00`;
      return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Concord//Reminder//PT',
        'BEGIN:VEVENT', `DTSTART:${startDt}`, `DTEND:${endDt}`, `SUMMARY:${title}`,
        `DESCRIPTION:Lembrete do Concord: ${title}`,
        'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
    };

    const downloadIcs = () => {
      const data = buildIcsData();
      if (!data) return;
      const blob = new Blob([data], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const isPast = reminderDate && new Date(`${reminderDate}T${reminderTime}`) < new Date();

    return (
      <div className="group flex items-start gap-2 py-1 px-1">
        <button
          onClick={() => deleteBlock(pageId, block.id)}
          className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-surface-400 mt-2 transition-opacity"
        >
          <GripVertical size={14} />
        </button>
        <div className={cn(
          'flex-1 border rounded-lg px-4 py-3',
          isPast ? 'bg-surface-800/30 border-surface-700' : 'bg-amber-600/5 border-amber-600/20',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className={isPast ? 'text-surface-500' : 'text-amber-400'} />
            <div
              ref={contentRef}
              contentEditable
              data-block-id={block.id}
              data-placeholder="Título do lembrete..."
              onInput={handleInput}
              className={cn(
                'flex-1 text-sm font-medium focus:outline-none',
                isPast ? 'text-surface-400 line-through' : 'text-surface-200',
              )}
              suppressContentEditableWarning
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-surface-500" />
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => usePagesStore.getState().updateBlockProperties(pageId, block.id, { reminderDate: e.target.value })}
                className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs text-surface-300 focus:outline-none focus:border-brand-500"
              />
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => usePagesStore.getState().updateBlockProperties(pageId, block.id, { reminderTime: e.target.value })}
                className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-xs text-surface-300 focus:outline-none focus:border-brand-500"
              />
            </div>
            {reminderDate && (
              <div className="flex items-center gap-1.5">
                <a
                  href={buildGoogleCalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded text-[11px] font-medium transition-colors"
                >
                  <ExternalLink size={10} /> Google Calendar
                </a>
                <button
                  onClick={downloadIcs}
                  className="flex items-center gap-1 px-2 py-1 bg-surface-700/50 text-surface-300 hover:bg-surface-700 rounded text-[11px] font-medium transition-colors"
                >
                  <ExternalLink size={10} /> Apple Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const contentClasses: Record<string, string> = {
    paragraph: 'text-surface-300 text-sm',
    heading1: 'text-2xl font-bold text-surface-100',
    heading2: 'text-xl font-semibold text-surface-100',
    heading3: 'text-lg font-semibold text-surface-200',
    bulletList: 'text-sm text-surface-300',
    numberedList: 'text-sm text-surface-300',
    quote: 'text-sm text-surface-400 italic border-l-3 border-surface-600 pl-4',
    code: 'font-mono text-xs text-emerald-400 bg-surface-950 rounded-md px-3 py-2',
    callout: 'text-sm text-surface-300 bg-surface-800/50 border border-surface-700 rounded-lg px-3 py-2',
    toggle: 'text-sm text-surface-300',
    todo: 'text-sm text-surface-300',
    reminder: 'text-sm text-surface-300',
  };

  const prefix = {
    bulletList: <span className="text-surface-500 mr-2 select-none">•</span>,
    numberedList: <span className="text-surface-500 mr-2 select-none font-mono text-xs">{index + 1}.</span>,
    todo: (
      <button
        onClick={() => toggleBlockChecked(pageId, block.id)}
        className="mr-2 text-surface-400 hover:text-brand-400 transition-colors"
      >
        {block.properties.checked ? (
          <CheckSquare size={16} className="text-brand-500" />
        ) : (
          <div className="w-4 h-4 border border-surface-600 rounded" />
        )}
      </button>
    ),
    callout: (
      <span className="mr-2 text-lg select-none">{(block.properties.calloutIcon as string) ?? '💡'}</span>
    ),
    toggle: (
      <button
        onClick={() => toggleBlockCollapsed(pageId, block.id)}
        className="mr-1 text-surface-400 hover:text-surface-200 transition-colors"
      >
        {block.properties.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>
    ),
  };

  return (
    <div className="group flex items-start gap-2 py-0.5 px-1 relative">
      <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-surface-600 hover:text-surface-400">
            <Plus size={14} />
          </button>
          {showMenu && (
            <BlockTypeMenu
              onSelect={(type) => { addBlock(pageId, type, block.id); setShowMenu(false); }}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
        <button className="text-surface-600 hover:text-surface-400 cursor-grab">
          <GripVertical size={14} />
        </button>
      </div>

      <div className="flex-1 min-w-0 flex items-start">
        {prefix[block.type as keyof typeof prefix]}

        <div
          ref={contentRef}
          contentEditable
          data-block-id={block.id}
          data-placeholder={
            block.type === 'paragraph'
              ? "Digite '/' para comandos..."
              : `${BLOCK_TYPE_CONFIG[block.type].label}...`
          }
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 focus:outline-none whitespace-pre-wrap break-words',
            contentClasses[block.type] ?? contentClasses.paragraph,
            block.type === 'todo' && block.properties.checked && 'line-through text-surface-600',
          )}
          suppressContentEditableWarning
        />

        {showTypeMenu && (
          <div className="relative">
            <BlockTypeMenu
              filter={typeFilter}
              onSelect={(type) => { changeBlockType(pageId, block.id, type); setShowTypeMenu(false); }}
              onClose={() => setShowTypeMenu(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
