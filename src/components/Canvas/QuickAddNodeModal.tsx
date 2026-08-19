import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { NODE_CATALOG } from '../../data/nodeCatalog';
import type { TradingNodeConfig } from '../../types/flow';

interface QuickAddNodeModalProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNode: (config: TradingNodeConfig, pos: { x: number; y: number } | null) => void;
}

export const QuickAddNodeModal: React.FC<QuickAddNodeModalProps> = ({
  isOpen,
  position,
  onClose,
  onAddNode,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'data', label: 'Data' },
    { id: 'feature', label: 'Signals' },
    { id: 'label', label: 'Labels' },
    { id: 'model', label: 'AI Models' },
    { id: 'backtest', label: 'Backtest' },
  ];

  const filteredNodes = NODE_CATALOG.filter((node) => {
    const matchesCat = selectedCategory === 'all' || node.category === selectedCategory;
    const matchesSearch =
      node.title.toLowerCase().includes(search.toLowerCase()) ||
      node.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#12121a]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="p-3 border-b border-white/[0.08] flex items-center gap-3">
          <LucideIcons.Search size={16} className="text-[#007aff]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search node (e.g. FracDiff, LightGBM, Triple Barrier)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-white/30"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <LucideIcons.X size={16} />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-3 pt-2 flex items-center gap-2 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#007aff] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40 italic">
              No matching nodes found.
            </div>
          ) : (
            filteredNodes.map((node) => {
              const IconComp = (LucideIcons as any)[node.icon] || LucideIcons.Box;
              return (
                <button
                  key={node.id}
                  onClick={() => {
                    onAddNode(node, position);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-white/[0.08] flex items-center gap-3 transition-all text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:scale-105 transition-all">
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{node.title}</div>
                    <div className="text-[10px] text-[#86868b] truncate">{node.subtitle}</div>
                  </div>
                  <LucideIcons.Plus size={14} className="text-white/40 group-hover:text-[#007aff] transition-colors" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
