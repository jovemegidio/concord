import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, Star, FileText, ChevronRight, ChevronDown,
  GripVertical, Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Minus, Code, AlertCircle, Image, ToggleLeft, X,
  Bell, Calendar, ExternalLink, Upload,
} from 'lucide-react';
import { useNavigationStore, usePagesStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelativeDate } from '@/lib/utils';
import type { Block, BlockType, Page, ID } from '@/types';

// ── BLOCK TYPE CONFIG ───────────────────────────────────────
const BLOCK_TYPE_CONFIG: Record<BlockType, { label: string; icon: React.ReactNode }> = {
  paragraph: { label: 'Texto', icon: <Type size={14} /> },
  heading1: { label: 'Título 1', icon: <Heading1 size={14} /> },
  heading2: { label: 'Título 2', icon: <Heading2 size={14} /> },
  heading3: { label: 'Título 3', icon: <Heading3 size={14} /> },
  bulletList: { label: 'Lista', icon: <List size={14} /> },
  numberedList: { label: 'Lista Numerada', icon: <ListOrdered size={14} /> },
  todo: { label: 'Tarefa', icon: <CheckSquare size={14} /> },
  quote: { label: 'Citação', icon: <Quote size={14} /> },
  divider: { label: 'Divisor', icon: <Minus size={14} /> },
  code: { label: 'Código', icon: <Code size={14} /> },
  callout: { label: 'Destaque', icon: <AlertCircle size={14} /> },
  image: { label: 'Imagem', icon: <Image size={14} /> },
  toggle: { label: 'Toggle', icon: <ToggleLeft size={14} /> },
  reminder: { label: 'Lembrete', icon: <Bell size={14} /> },
};

// ── BLOCK TYPE SELECTOR ─────────────────────────────────────
const BlockTypeMenu: React.FC<{
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filter?: string;
}> = ({ onSelect, onClose, filter }) => {
  const types = Object.entries(BLOCK_TYPE_CONFIG).filter(
    ([, cfg]) => !filter || cfg.label.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 py-1 w-56 max-h-64 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] text-surface-500 uppercase tracking-wider">Tipos de bloco</p>
        {types.map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => { onSelect(type as BlockType); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center text-surface-400">{cfg.icon}</span>
            {cfg.label}
          </button>
        ))}
        {types.length === 0 && (
          <p className="px-3 py-2 text-sm text-surface-500">Nenhum bloco encontrado</p>
        )}
      </div>
    </>
  );
};

// ── BLOCK RENDERER ──────────────────────────────────────────
const BlockRenderer: React.FC<{
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

  // Sync content from store → DOM only when block identity changes (not on local edits)
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
        // Focus new block after render
        setTimeout(() => {
          const newEl = document.querySelector(`[data-block-id="${newId}"]`) as HTMLElement;
          newEl?.focus();
        }, 50);
      }

      if (e.key === 'Backspace' && (contentRef.current?.textContent ?? '') === '') {
        e.preventDefault();
        deleteBlock(pageId, block.id);
      }

      // Slash command for block type
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
            <img
              src={block.properties.imageUrl as string}
              alt=""
              className="rounded-lg max-h-64 object-cover"
            />
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

    // Google Calendar URL builder
    const buildGoogleCalUrl = () => {
      if (!reminderDate) return '#';
      const date = reminderDate.replace(/-/g, '');
      const [h, m] = reminderTime.split(':');
      const startDt = `${date}T${h}${m}00`;
      // End = start + 1 hour
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

    // Apple Calendar (.ics) download
    const buildIcsData = () => {
      if (!reminderDate) return '';
      const date = reminderDate.replace(/-/g, '');
      const [h, m] = reminderTime.split(':');
      const startDt = `${date}T${h}${m}00`;
      const endH = String(parseInt(h) + 1).padStart(2, '0');
      const endDt = `${date}T${endH}${m}00`;
      return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Concord//Reminder//PT',
        'BEGIN:VEVENT',
        `DTSTART:${startDt}`,
        `DTEND:${endDt}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:Lembrete do Concord: ${title}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${title}`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
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
          isPast
            ? 'bg-surface-800/30 border-surface-700'
            : 'bg-amber-600/5 border-amber-600/20',
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
                  <ExternalLink size={10} />
                  Google Calendar
                </a>
                <button
                  onClick={downloadIcs}
                  className="flex items-center gap-1 px-2 py-1 bg-surface-700/50 text-surface-300 hover:bg-surface-700 rounded text-[11px] font-medium transition-colors"
                >
                  <ExternalLink size={10} />
                  Apple Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Content classes per block type
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

  // Prefix for list items
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
      {/* Drag handle + menu */}
      <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-surface-600 hover:text-surface-400"
          >
            <Plus size={14} />
          </button>
          {showMenu && (
            <BlockTypeMenu
              onSelect={(type) => {
                addBlock(pageId, type, block.id);
                setShowMenu(false);
              }}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
        <button className="text-surface-600 hover:text-surface-400 cursor-grab">
          <GripVertical size={14} />
        </button>
      </div>

      {/* Block content */}
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

        {/* Slash command menu */}
        {showTypeMenu && (
          <div className="relative">
            <BlockTypeMenu
              filter={typeFilter}
              onSelect={(type) => {
                changeBlockType(pageId, block.id, type);
                setShowTypeMenu(false);
              }}
              onClose={() => setShowTypeMenu(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── PAGE SIDEBAR ────────────────────────────────────────────
const PageSidebar: React.FC = () => {
  const { activeWorkspaceId, activePageId, setActivePage } = useNavigationStore();
  const { getRootPages, getChildPages, createPage, deletePage, toggleFavorite, favorites, pages } = usePagesStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const rootPages = activeWorkspaceId ? getRootPages(activeWorkspaceId) : [];
  const favoritePages = pages.filter((p) => favorites.includes(p.id));

  const handleCreate = () => {
    if (!newTitle.trim() || !activeWorkspaceId) return;
    const id = createPage(activeWorkspaceId, newTitle.trim());
    setActivePage(id);
    setNewTitle('');
    setShowCreate(false);
  };

  // Recursive page tree
  const PageTreeItem: React.FC<{ page: Page; depth: number }> = ({ page, depth }) => {
    const [expanded, setExpanded] = useState(false);
    const childPages = getChildPages(page.id);
    const hasChildren = childPages.length > 0;

    return (
      <>
        <div
          className={cn(
            'flex items-center gap-1 py-1 px-2 mx-1 rounded-md text-sm cursor-pointer group transition-colors',
            activePageId === page.id
              ? 'bg-surface-800/70 text-surface-100'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/30',
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-surface-500">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-3" />
          )}

          <span onClick={() => setActivePage(page.id)} className="flex-1 flex items-center gap-1.5 truncate">
            <span className="text-sm">{page.icon}</span>
            <span className="truncate">{page.title || 'Sem título'}</span>
          </span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(page.id); }}
              className={cn('text-surface-500 hover:text-amber-400', favorites.includes(page.id) && 'text-amber-400')}
            >
              <Star size={10} fill={favorites.includes(page.id) ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!activeWorkspaceId) return;
                const childId = createPage(activeWorkspaceId, 'Sem título', '📄', page.id);
                setActivePage(childId);
                setExpanded(true);
              }}
              className="text-surface-500 hover:text-surface-200"
            >
              <Plus size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
              className="text-surface-500 hover:text-red-400"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>

        {expanded && childPages.map((child) => (
          <PageTreeItem key={child.id} page={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="w-60 min-w-[240px] bg-surface-900 flex flex-col border-r border-surface-800/50">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-surface-800/50">
        <FileText size={18} className="text-surface-500 mr-2" />
        <h3 className="font-semibold text-surface-200">Notas</h3>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {/* Favorites */}
        {favoritePages.length > 0 && (
          <>
            <p className="px-3 py-1 text-[10px] text-surface-500 uppercase tracking-wider font-semibold">
              ★ Favoritos
            </p>
            {favoritePages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={cn(
                  'flex items-center gap-1.5 w-full px-3 py-1.5 text-sm transition-colors',
                  activePageId === page.id
                    ? 'bg-surface-800/70 text-surface-100'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/30',
                )}
              >
                <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />
                <span className="text-sm mr-1">{page.icon}</span>
                <span className="truncate">{page.title || 'Sem título'}</span>
              </button>
            ))}
            <div className="h-px bg-surface-800 my-2 mx-3" />
          </>
        )}

        {/* All pages tree */}
        <p className="px-3 py-1 text-[10px] text-surface-500 uppercase tracking-wider font-semibold">
          Notas
        </p>
        {rootPages.map((page) => (
          <PageTreeItem key={page.id} page={page} depth={0} />
        ))}

        {rootPages.length === 0 && !showCreate && (
          <div className="px-4 py-8 text-center">
            <FileText size={32} className="text-surface-700 mx-auto mb-2" />
            <p className="text-xs text-surface-600">Nenhuma nota ainda</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-surface-800/50">
        {showCreate ? (
          <div className="space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              placeholder="Título da nota..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} className="flex-1">Criar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCreate(true)}
            icon={<Plus size={14} />}
            className="w-full"
          >
            Nova Nota
          </Button>
        )}
      </div>
    </div>
  );
};

// ── PAGE EDITOR ─────────────────────────────────────────────
const PageEditor: React.FC<{ page: Page }> = ({ page }) => {
  const { renamePage, setPageIcon, addBlock, setPageCover, getPageById } = usePagesStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(page.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverUrl, setCoverUrl] = useState(page.coverImage || '');
  const { setActivePage } = useNavigationStore();

  useEffect(() => {
    setTitleValue(page.title);
    setCoverUrl(page.coverImage || '');
  }, [page.id, page.title, page.coverImage]);

  // Build breadcrumb chain
  const breadcrumbs: Page[] = [];
  let current: Page | undefined = page.parentId ? getPageById(page.parentId) : undefined;
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parentId ? getPageById(current.parentId) : undefined;
  }

  const COMMON_EMOJIS = [
    '📄', '📝', '📋', '📌', '📎', '📑', '🗂️', '📁',
    '💡', '🎯', '🚀', '⚡', '🔥', '✨', '💻', '🛠️',
    '📊', '📈', '🎨', '🧪', '🔍', '📚', '🗺️', '🏠',
  ];

  const handleTitleSave = () => {
    renamePage(page.id, titleValue || 'Sem título');
    setEditingTitle(false);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-surface-500 mb-4 -mt-4 flex-wrap">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.id}>
                <button
                  onClick={() => setActivePage(bc.id)}
                  className="hover:text-surface-300 transition-colors flex items-center gap-1"
                >
                  <span>{bc.icon}</span>
                  <span>{bc.title || 'Sem título'}</span>
                </button>
                {i < breadcrumbs.length && (
                  <ChevronRight size={10} className="text-surface-600" />
                )}
              </React.Fragment>
            ))}
            <span className="text-surface-400 flex items-center gap-1">
              <span>{page.icon}</span>
              <span>{page.title || 'Sem título'}</span>
            </span>
          </div>
        )}
        {/* Cover area */}
        {page.coverImage ? (
          <div className="relative h-48 -mx-8 -mt-12 mb-6 rounded-t-lg overflow-hidden group">
            <img src={page.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setShowCoverInput(true); setCoverUrl(page.coverImage || ''); }}
                className="bg-surface-900/80 text-surface-300 text-xs px-2 py-1 rounded hover:bg-surface-800 transition-colors"
              >
                Trocar capa
              </button>
              <button
                onClick={() => setPageCover(page.id, '')}
                className="bg-surface-900/80 text-red-400 text-xs px-2 py-1 rounded hover:bg-surface-800 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="-mx-8 -mt-12 mb-6 flex justify-center">
            <button
              onClick={() => setShowCoverInput(true)}
              className="text-xs text-surface-500 hover:text-surface-300 py-2 px-3 rounded hover:bg-surface-800 transition-colors flex items-center gap-1"
            >
              <Image size={12} /> Adicionar capa
            </button>
          </div>
        )}

        {/* Cover URL input + file upload */}
        {showCoverInput && (
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Cole a URL da imagem de capa..."
                className="flex-1 bg-surface-800 border border-surface-700 rounded px-3 py-1.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                autoFocus
              />
              <Button size="sm" onClick={() => { setPageCover(page.id, coverUrl); setShowCoverInput(false); }} disabled={!coverUrl.trim()}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCoverInput(false)}>
                Cancelar
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-surface-500 uppercase">ou</span>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 border border-surface-700 rounded text-sm text-surface-400 hover:border-brand-500 hover:text-surface-200 transition-colors cursor-pointer">
                <Upload size={14} />
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
                        setPageCover(page.id, reader.result);
                        setShowCoverInput(false);
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

        {/* Page icon */}
        <div className="relative inline-block mb-4">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-5xl hover:opacity-75 transition-opacity"
          >
            {page.icon}
          </button>
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
              <div className="absolute left-0 top-full mt-2 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 p-3 w-64">
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setPageIcon(page.id, emoji); setShowEmojiPicker(false); }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-700 text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="w-full text-4xl font-bold bg-transparent text-surface-100 focus:outline-none mb-4"
            placeholder="Sem título"
            autoFocus
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="text-4xl font-bold text-surface-100 cursor-text hover:text-surface-50 transition-colors mb-4"
          >
            {page.title || 'Sem título'}
          </h1>
        )}

        {/* Meta info */}
        <div className="text-xs text-surface-600 mb-8 flex items-center gap-3">
          <span>Última edição {formatRelativeDate(page.updatedAt)}</span>
          <span>·</span>
          <span>{page.blocks.length} bloco{page.blocks.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Blocks */}
        <div className="space-y-0.5">
          {page.blocks.map((block, index) => (
            <BlockRenderer key={block.id} block={block} pageId={page.id} index={index} />
          ))}
        </div>

        {/* Add block at bottom */}
        <button
          onClick={() => addBlock(page.id, 'paragraph')}
          className="w-full text-left py-2 px-1 text-sm text-surface-600 hover:text-surface-400 mt-4 transition-colors"
        >
          + Adicionar bloco
        </button>
      </div>
    </div>
  );
};

// ── PAGES VIEW (MAIN EXPORT) ────────────────────────────────
export const PagesView: React.FC = () => {
  const { activePageId, setActivePage } = useNavigationStore();
  const { getPageById } = usePagesStore();

  const { activeWorkspaceId } = useNavigationStore();
  const rootPages = activeWorkspaceId ? usePagesStore.getState().getRootPages(activeWorkspaceId) : [];
  const page = activePageId ? getPageById(activePageId) : undefined;

  // Clear stale active page reference or page from wrong workspace
  useEffect(() => {
    if (activePageId) {
      if (!page) {
        setActivePage(null);
      } else if (activeWorkspaceId && page.workspaceId !== activeWorkspaceId) {
        setActivePage(null);
      }
    }
  }, [activePageId, page, activeWorkspaceId, setActivePage]);

  // Auto-select first page if none is active and pages exist
  useEffect(() => {
    if (!activePageId && rootPages.length > 0) {
      setActivePage(rootPages[0].id);
    }
  }, [activePageId, rootPages, setActivePage]);

  return (
    <div className="flex flex-1 min-w-0">
      <PageSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {page ? (
          <PageEditor page={page} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-surface-500" />
              </div>
              <h3 className="text-xl font-bold text-surface-200 mb-2">Selecione uma Nota</h3>
              <p className="text-sm text-surface-500">
                Escolha uma nota na barra lateral ou crie uma nova para começar a escrever.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
