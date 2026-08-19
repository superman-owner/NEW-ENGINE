import React, { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ConfirmDialogProps {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info' | 'alert';
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        else onConfirm();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const isAlertOnly = type === 'alert' || !onCancel;
  const defaultTitle = type === 'danger' ? 'Confirm Deletion' : type === 'warning' ? 'Warning' : 'Information';

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={() => {
        if (onCancel) onCancel();
        else onConfirm();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          borderRadius: '18px',
          background: isLight
            ? 'linear-gradient(160deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 245, 250, 0.96) 100%)'
            : 'linear-gradient(160deg, rgba(26, 26, 32, 0.96) 0%, rgba(12, 12, 16, 0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.10)' : '1px solid rgba(255, 255, 255, 0.13)',
          boxShadow: isLight
            ? '0 24px 60px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
            : '0 32px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.20)',
          overflow: 'hidden',
          fontFamily: 'var(--font-apple-text)',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content Body (Clean & Perfectly Balanced) */}
        <div style={{ padding: '22px 20px 18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontSize: '15.5px',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: isLight ? '#1d1d1f' : '#ffffff',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {title || defaultTitle}
          </h3>
          <p
            style={{
              fontSize: '12.5px',
              lineHeight: 1.55,
              color: isLight ? '#6e6e73' : 'rgba(255, 255, 255, 0.65)',
              margin: 0,
              maxWidth: '265px',
              letterSpacing: '-0.01em',
            }}
          >
            {message}
          </p>
        </div>

        {/*  Apple OLED 2-Column Action Buttons Row */}
        <div
          style={{
            padding: '0 16px 16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxSizing: 'border-box',
          }}
        >
          {!isAlertOnly && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                height: '34px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.10)',
                color: isLight ? '#1d1d1f' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              height: '34px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              background:
                type === 'danger'
                  ? 'linear-gradient(180deg, #ff453a 0%, #e03126 100%)'
                  : 'linear-gradient(180deg, #0a84ff 0%, #0071e3 100%)',
              border:
                type === 'danger'
                  ? '1px solid rgba(255, 69, 58, 0.6)'
                  : '1px solid rgba(10, 132, 255, 0.6)',
              boxShadow:
                type === 'danger'
                  ? '0 4px 14px rgba(255, 69, 58, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.35)'
                  : '0 4px 14px rgba(10, 132, 255, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {confirmText || (isAlertOnly ? 'OK' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

