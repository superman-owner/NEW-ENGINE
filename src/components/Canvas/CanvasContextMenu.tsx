import React, { useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import type { Node } from '@xyflow/react';

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  targetNode: Node | null;
  selectedNodes: Node[];
  hasClipboard: boolean;
  onClose: () => void;
  onCopy: () => void;
  onPaste: (pos?: { x: number; y: number }) => void;
  onDuplicate: () => void;
  onCut: () => void;
  onDelete: () => void;
}

export const CanvasContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  flowPosition,
  targetNode,
  selectedNodes,
  hasClipboard,
  onClose,
  onCopy,
  onPaste,
  onDuplicate,
  onCut,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isNodeMenu = !!targetNode || selectedNodes.length > 0;

  // Viewport boundary clamping
  const menuWidth = 190;
  const menuHeight = isNodeMenu ? 210 : 54;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 16);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 context-menu-container select-none animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: clampedX,
        top: clampedY,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isNodeMenu ? (
        /*  1. Node Context Menu */
        <>
          {/* 1. Cut */}
          <button
            onClick={() => {
              onCut();
              onClose();
            }}
            className="context-menu-item"
          >
            <div className="context-menu-left">
              <LucideIcons.Scissors size={15} className="text-[#38bdf8]" />
              <span>Cut</span>
            </div>
            <span className="context-menu-shortcut">Ctrl+X</span>
          </button>

          {/* 2. Copy */}
          <button
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="context-menu-item"
          >
            <div className="context-menu-left">
              <LucideIcons.Copy size={15} className="text-[#38bdf8]" />
              <span>Copy</span>
            </div>
            <span className="context-menu-shortcut">Ctrl+C</span>
          </button>

          {/* 3. Paste */}
          <button
            disabled={!hasClipboard}
            onClick={() => {
              onPaste(flowPosition);
              onClose();
            }}
            className={`context-menu-item ${!hasClipboard ? 'disabled' : ''}`}
          >
            <div className="context-menu-left">
              <LucideIcons.ClipboardPaste
                size={15}
                className={hasClipboard ? 'text-[#38bdf8]' : 'text-[#737373]'}
              />
              <span>Paste</span>
            </div>
            <span className="context-menu-shortcut">Ctrl+V</span>
          </button>

          {/* 4. Duplicate */}
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="context-menu-item"
          >
            <div className="context-menu-left">
              <LucideIcons.CopyPlus size={15} className="text-[#38bdf8]" />
              <span>Duplicate</span>
            </div>
            <span className="context-menu-shortcut">Ctrl+D</span>
          </button>

          {/* 5. Delete */}
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="context-menu-item danger"
          >
            <div className="context-menu-left">
              <LucideIcons.Trash2 size={15} />
              <span>Delete</span>
            </div>
            <span className="context-menu-shortcut">Del</span>
          </button>
        </>
      ) : (
        /*  2. Empty Canvas Context Menu: Strictly Paste Only */
        <button
          disabled={!hasClipboard}
          onClick={() => {
            onPaste(flowPosition);
            onClose();
          }}
          className={`context-menu-item ${!hasClipboard ? 'disabled' : ''}`}
        >
          <div className="context-menu-left">
            <LucideIcons.ClipboardPaste
              size={15}
              className={hasClipboard ? 'text-[#38bdf8]' : 'text-[#737373]'}
            />
            <span>Paste</span>
          </div>
          <span className="context-menu-shortcut">Ctrl+V</span>
        </button>
      )}
    </div>
  );
};
