import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  getAppSettings,
  saveAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ComputeDevice,
  type PrecisionMode,
  type RetrainTrigger,
} from '../../services/appSettingsService';

interface MainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type SettingsTab = 'account' | 'compute' | 'autoRetrain' | 'storage' | 'production';

export const MainSettingsModal: React.FC<MainSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAppSettings());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAppSettings(settings);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setSettings(DEFAULT_APP_SETTINGS);
  };

  const tabs: { id: SettingsTab; label: string; icon: keyof typeof LucideIcons; badge?: string }[] = [
    { id: 'account', label: 'Account & License', icon: 'User' },
    { id: 'compute', label: 'Compute (CPU / GPU)', icon: 'Cpu', badge: settings.compute.device.toUpperCase() },
    { id: 'autoRetrain', label: 'Auto Retrain', icon: 'RefreshCw', badge: settings.autoRetrain.enabled ? 'ON' : 'OFF' },
    { id: 'storage', label: 'Storage & Destination', icon: 'HardDrive' },
    { id: 'production', label: 'Production Guardrails', icon: 'ShieldAlert', badge: 'PRO' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(0, 0, 0, 0.80)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        userSelect: 'none',
        fontFamily: 'var(--font-apple-text)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '840px',
          maxWidth: '96vw',
          height: '560px',
          maxHeight: '92vh',
          borderRadius: '16px',
          boxSizing: 'border-box',
          background: isLight
            ? 'linear-gradient(180deg, #ffffff, #f7f7f9)'
            : 'linear-gradient(180deg, #181820 0%, #0d0d12 100%)',
          border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isLight
            ? '0 24px 60px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0,0,0,0.06)'
            : '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          textAlign: 'left',
        }}
      >
        {/*  1. Modal Title Bar */}
        <div
          style={{
            height: '48px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? '#eaeaea' : '#22222a',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LucideIcons.Settings size={17} style={{ color: isLight ? '#0071e3' : '#0a84ff' }} />
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: isLight ? '#1d1d1f' : '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              System Settings
            </h2>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: isLight ? 'rgba(0, 113, 227, 0.12)' : 'rgba(10, 132, 255, 0.18)',
                color: isLight ? '#0071e3' : '#38bdf8',
                letterSpacing: '0.02em',
              }}
            >
              v2.0 Quant AI
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#6e6e73' : 'rgba(255, 255, 255, 0.45)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#1d1d1f' : '#ffffff';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#6e6e73' : 'rgba(255, 255, 255, 0.45)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Close Settings"
          >
            <LucideIcons.X size={16} />
          </button>
        </div>

        {/*  2. Main Two-Column Layout (Sidebar + Tab Content) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar Navigation */}
          <div
            style={{
              width: '210px',
              borderRight: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: isLight ? '#f2f2f5' : '#14141c',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {tabs.map((t) => {
              const IconComp = (LucideIcons as any)[t.icon] || LucideIcons.Circle;
              const isActive = activeTab === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive
                      ? isLight ? '#0071e3' : '#007aff'
                      : 'transparent',
                    color: isActive
                      ? '#ffffff'
                      : isLight ? '#333333' : '#cccccc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(0, 122, 255, 0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = isLight ? '#000000' : '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = isLight ? '#333333' : '#cccccc';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconComp size={14} />
                    <span>{t.label}</span>
                  </div>
                  {t.badge && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1.5px 5px',
                        borderRadius: '4px',
                        backgroundColor: isActive
                          ? 'rgba(255, 255, 255, 0.25)'
                          : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#ffffff' : isLight ? '#666666' : '#aaaaaa',
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Tab Content View */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* TAB 1: Account & License */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                    Account & Cloud License
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                    Manage your FXFORGE Quant subscription, team credentials, and cloud model syncing.
                  </p>
                </div>

                {/* Profile Card */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#007aff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '16px',
                        boxShadow: '0 0 12px rgba(0, 122, 255, 0.4)',
                      }}
                    >
                      QA
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                          {settings.account.username}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                          }}
                        >
                          ACTIVE PRO
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                        {settings.account.email} • {settings.account.tier}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        account: {
                          ...prev.account,
                          isLoggedIn: !prev.account.isLoggedIn,
                        },
                      }));
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                      color: isLight ? '#1d1d1f' : '#ffffff',
                    }}
                  >
                    {settings.account.isLoggedIn ? 'Sign Out' : 'Sign In'}
                  </button>
                </div>

                {/* License Key */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                    Enterprise License Key
                  </label>
                  <input
                    type="text"
                    value={settings.account.licenseKey}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        account: { ...prev.account, licenseKey: e.target.value },
                      }))
                    }
                    placeholder="FXF-ENT-XXXX-XXXX-2026"
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-apple-numbers)',
                      letterSpacing: '0.05em',
                      border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      color: isLight ? '#111827' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Cloud Sync Toggle */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                      Auto Cloud Synchronization
                    </span>
                    <span style={{ fontSize: '11px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                      Sync strategy DAGs, checkpoints & live telemetry to cloud repository
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.account.cloudSyncEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        account: { ...prev.account, cloudSyncEnabled: e.target.checked },
                      }))
                    }
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#007aff' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Compute & Hardware Acceleration (CPU / GPU) */}
            {activeTab === 'compute' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                    Compute Hardware & Acceleration
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                    Select deep learning tensor device, multi-threading allocation, and float precision.
                  </p>
                </div>

                {/* Device Selector Cards */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '8px' }}>
                    Processing Device Filter
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'auto' as ComputeDevice, title: 'Auto-Detect', desc: 'Optimal GPU/CPU dynamic routing' },
                      { id: 'gpu' as ComputeDevice, title: 'GPU (CUDA / Metal)', desc: 'NVIDIA RTX & Apple Silicon GPU' },
                      { id: 'cpu' as ComputeDevice, title: 'CPU Multi-Core', desc: 'AVX-512 multi-thread OpenMP' },
                      { id: 'directml' as ComputeDevice, title: 'DirectML', desc: 'Windows hardware acceleration' },
                    ].map((d) => {
                      const isSel = settings.compute.device === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              compute: { ...prev.compute, device: d.id },
                            }))
                          }
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSel
                              ? isLight ? 'rgba(0, 113, 227, 0.1)' : 'rgba(10, 132, 255, 0.16)'
                              : isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                            border: isSel
                              ? '1.5px solid #007aff'
                              : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: isSel ? '#007aff' : isLight ? '#111827' : '#ffffff' }}>
                              {d.title}
                            </span>
                            {isSel && <LucideIcons.Check size={13} style={{ color: '#007aff' }} />}
                          </div>
                          <span style={{ fontSize: '10.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>{d.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Worker Threads & GPU VRAM Allocation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Worker CPU Cores ({settings.compute.threads} Threads)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={32}
                      step={1}
                      value={settings.compute.threads}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          compute: { ...prev.compute, threads: Number(e.target.value) },
                        }))
                      }
                      style={{ width: '100%', accentColor: '#007aff', cursor: 'pointer' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Tensor Precision Mode
                    </label>
                    <select
                      value={settings.compute.precision}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          compute: { ...prev.compute, precision: e.target.value as PrecisionMode },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : '#22222c',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                      }}
                    >
                      <option value="fp16">FP16 (Half Precision - Fast GPU Recommended)</option>
                      <option value="fp32">FP32 (Single Precision - Full Numerical Depth)</option>
                      <option value="int8">INT8 (Quantized Low-Latency Inference)</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '11px',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LucideIcons.CheckCircle size={13} />
                  <span>Hardware Acceleration: {settings.compute.detectedGpuName}</span>
                </div>
              </div>
            )}

            {/* TAB 3: Auto Retrain & Learning */}
            {activeTab === 'autoRetrain' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                    Auto Retrain & Continual Learning
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                    Configure automatic RL policy updates triggered by drawdown, Sharpe decay, or schedule.
                  </p>
                </div>

                {/* Master Switch */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                      Enable Autonomous Retraining Engine
                    </span>
                    <span style={{ fontSize: '11px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                      Automatically fine-tune Neural weights when market regime drifts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoRetrain.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoRetrain: { ...prev.autoRetrain, enabled: e.target.checked },
                      }))
                    }
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#007aff' }}
                  />
                </div>

                {/* Retrain Trigger Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Retrain Trigger Condition
                    </label>
                    <select
                      value={settings.autoRetrain.trigger}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRetrain: { ...prev.autoRetrain, trigger: e.target.value as RetrainTrigger },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : '#22222c',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                      }}
                    >
                      <option value="drawdown">Max Drawdown Limit Breach</option>
                      <option value="sharpe">Sharpe Ratio Decay Below Threshold</option>
                      <option value="drift">Market Volatility Regime Drift</option>
                      <option value="scheduled">Scheduled Routine (Sunday / Market Close)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Drawdown Trigger Breach (%)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      value={settings.autoRetrain.drawdownThresholdPct}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRetrain: { ...prev.autoRetrain, drawdownThresholdPct: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Retrain Epochs & Safety Rollback */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Retraining Epochs per Trigger
                    </label>
                    <input
                      type="number"
                      step={25}
                      value={settings.autoRetrain.retrainEpochs}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRetrain: { ...prev.autoRetrain, retrainEpochs: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                      Min Out-of-Sample Sharpe for Deploy
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      value={settings.autoRetrain.validationMinSharpe}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRetrain: { ...prev.autoRetrain, validationMinSharpe: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Storage & Destination */}
            {activeTab === 'storage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                    Local Storage & Export Destination
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                    Specify local file system destination paths for compiled MT5 Expert Advisors and ONNX models.
                  </p>
                </div>

                {/* MQL5 / EA Export Directory */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                    MT5 Experts Output Directory (.mq5 / .ex5)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={settings.storage.exportDirectory}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          storage: { ...prev.storage, exportDirectory: e.target.value },
                        }))
                      }
                      placeholder="C:\MetaTrader 5\MQL5\Experts\..."
                      style={{
                        flex: 1,
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => alert('Selected default system export directory.')}
                      style={{
                        padding: '0 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                        color: isLight ? '#1d1d1f' : '#ffffff',
                      }}
                    >
                      Browse...
                    </button>
                  </div>
                </div>

                {/* Backup & Checkpoint Directory */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '6px' }}>
                    Local Backup & Checkpoints Directory
                  </label>
                  <input
                    type="text"
                    value={settings.storage.backupDirectory}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, backupDirectory: e.target.value },
                      }))
                    }
                    placeholder="Z:\FXFORGE_BACKUPS\Checkpoints"
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      color: isLight ? '#111827' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Auto Export Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                      Auto-Export MQL5 on Save
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoExportMql5}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          storage: { ...prev.storage, autoExportMql5: e.target.checked },
                        }))
                      }
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#007aff' }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                      Auto-Export ONNX on Train
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoExportOnnx}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          storage: { ...prev.storage, autoExportOnnx: e.target.checked },
                        }))
                      }
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#007aff' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Production & Risk Rules (คำแนะนำสำหรับ Production) */}
            {activeTab === 'production' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isLight ? '#111827' : '#ffffff' }}>
                    Production Risk Guardrails & Safeguards
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                    Institutional-grade risk controls, slippage filters, circuit breakers, and webhook notifications.
                  </p>
                </div>

                {/* Risk Parameters Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '4px' }}>
                      Daily Loss Circuit Breaker (%)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      value={settings.production.circuitBreakerMaxLossPct}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          production: { ...prev.production, circuitBreakerMaxLossPct: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '4px' }}>
                      Max Spread Filter (Pips)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      value={settings.production.maxSpreadPips}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          production: { ...prev.production, maxSpreadPips: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db', marginBottom: '4px' }}>
                      Bridge Latency Alert (ms)
                    </label>
                    <input
                      type="number"
                      step={5}
                      value={settings.production.bridgeLatencyThresholdMs}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          production: { ...prev.production, bridgeLatencyThresholdMs: Number(e.target.value) },
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-apple-numbers)',
                        border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Webhook URL Input */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: isLight ? '#374151' : '#d1d5db' }}>
                      Telegram / Discord Webhook URL
                    </label>
                    <span style={{ fontSize: '10.5px', color: isLight ? '#6b7280' : '#9ca3af' }}>
                      Real-time execution & retrain pings
                    </span>
                  </div>
                  <input
                    type="text"
                    value={settings.production.webhookUrl}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        production: { ...prev.production, webhookUrl: e.target.value },
                      }))
                    }
                    placeholder="https://discord.com/api/webhooks/..."
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      color: isLight ? '#111827' : '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Production Best Practice Alert Box */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    fontSize: '11px',
                    color: isLight ? '#854d0e' : '#facc15',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>💡 Quant Production Checklist:</span>
                  <span>1. Always run on VPS with sub-5ms ping to broker server.</span>
                  <span>2. Keep Circuit Breaker at ≤ 3.0% to prevent catastrophic black swan events.</span>
                  <span>3. Enable out-of-sample Sharpe guardrail (&gt; 1.5) before auto-deploying retrained models.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/*  3. Modal Footer Bar */}
        <div
          style={{
            height: '48px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? '#eaeaea' : '#22222a',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'transparent',
              color: isLight ? '#6e6e73' : '#9ca3af',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#1d1d1f' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#6e6e73' : '#9ca3af';
            }}
          >
            Reset Defaults
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.18)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#1d1d1f' : '#ffffff',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#f5f5f7' : 'rgba(255, 255, 255, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: '6px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: saveSuccess ? '#10b981' : isLight ? '#0071e3' : '#007aff',
                color: '#ffffff',
                boxShadow: '0 1px 6px rgba(0, 122, 255, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!saveSuccess) e.currentTarget.style.backgroundColor = isLight ? '#0077ed' : '#0a84ff';
              }}
              onMouseLeave={(e) => {
                if (!saveSuccess) e.currentTarget.style.backgroundColor = isLight ? '#0071e3' : '#007aff';
              }}
            >
              {saveSuccess ? 'Saved ✓' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MainSettingsModal;
