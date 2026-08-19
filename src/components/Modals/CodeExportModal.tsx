import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  code: string;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  code,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alpha_strategy.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[85vh] apple-glass rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0a84ff]/15 border border-[#0a84ff]/30 text-[#0a84ff] flex items-center justify-center shadow-inner">
              <LucideIcons.FileCode size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Production Strategy Script
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
                  Compiled
                </span>
              </h3>
              <p className="text-[11px] text-[#86868b]">
                Generated from Apple Pro Flow Graph. Native Python 3.10+ execution engine.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#86868b] hover:text-white transition-colors cursor-pointer"
          >
            <LucideIcons.X size={16} />
          </button>
        </div>

        {/* Code View (Xcode Style) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-black/60 font-mono text-xs text-[#d1d1d6] leading-relaxed select-text shadow-inner">
          <pre className="p-2">
            <code>{code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#86868b]">
            <LucideIcons.Sparkles size={13} className="text-[#0a84ff]" />
            <span>Ready for autonomous deployment.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                copied
                  ? 'bg-[#30d158]/20 text-[#30d158] border-[#30d158]/40'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.08]'
              }`}
            >
              {copied ? <LucideIcons.Check size={14} /> : <LucideIcons.Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#007aff] hover:bg-[#0062cc] text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <LucideIcons.Download size={14} />
              <span>Download .py</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
