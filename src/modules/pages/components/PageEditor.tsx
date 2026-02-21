import React, { useState, useEffect } from 'react';
import { ChevronRight, Image, X, Upload } from 'lucide-react';
import { useNavigationStore, usePagesStore } from '@/stores';
import { Button } from '@/components/ui';
import { formatRelativeDate } from '@/lib/utils';
import { BlockRenderer } from './BlockRenderer';
import type { Page } from '@/types';

const COMMON_EMOJIS = [
  '📄', '📝', '📋', '📌', '📎', '📑', '🗂️', '📁',
  '💡', '🎯', '🚀', '⚡', '🔥', '✨', '💻', '🛠️',
  '📊', '📈', '🎨', '🧪', '🔍', '📚', '🗺️', '🏠',
];

export const PageEditor: React.FC<{ page: Page }> = ({ page }) => {
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
                {i < breadcrumbs.length && <ChevronRight size={10} className="text-surface-600" />}
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

        {/* Cover URL input */}
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
              <Button size="sm" variant="ghost" onClick={() => setShowCoverInput(false)}>Cancelar</Button>
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
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-5xl hover:opacity-75 transition-opacity">
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
