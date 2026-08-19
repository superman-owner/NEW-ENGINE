//  FXFORGE LAB - Application & Production System Settings Service

export type ComputeDevice = 'auto' | 'gpu' | 'cpu' | 'directml';
export type PrecisionMode = 'fp32' | 'fp16' | 'int8';
export type RetrainTrigger = 'drawdown' | 'sharpe' | 'drift' | 'scheduled';

export interface UserAccountSettings {
  isLoggedIn: boolean;
  username: string;
  email: string;
  tier: 'Community' | 'Pro Member' | 'Enterprise Quant';
  licenseKey: string;
  cloudSyncEnabled: boolean;
  lastSyncedAt?: string;
}

export interface ComputeSettings {
  device: ComputeDevice;
  threads: number;
  gpuMemoryGb: number;
  precision: PrecisionMode;
  enableCudaGraphs: boolean;
  detectedGpuName: string;
}

export interface AutoRetrainSettings {
  enabled: boolean;
  trigger: RetrainTrigger;
  drawdownThresholdPct: number;
  sharpeDecayThreshold: number;
  scheduleInterval: 'daily_close' | 'weekly_sunday' | 'monthly';
  retrainEpochs: number;
  validationMinSharpe: number;
  safetyRollback: boolean;
  autoDeployPassedModel: boolean;
}

export interface StorageDestinationSettings {
  exportDirectory: string;
  backupDirectory: string;
  autoExportMql5: boolean;
  autoExportOnnx: boolean;
  maxSnapshotsRetention: number;
  fileNamingPattern: string;
}

export interface ProductionGuardrailSettings {
  circuitBreakerMaxLossPct: number;
  maxSpreadPips: number;
  maxSlippagePips: number;
  bridgeLatencyThresholdMs: number;
  enableWebhooks: boolean;
  webhookUrl: string;
  alertOnRetrain: boolean;
  alertOnTrade: boolean;
  alertOnDrawdown: boolean;
  emergencyStopHotkey: string;
}

export interface AppSettings {
  account: UserAccountSettings;
  compute: ComputeSettings;
  autoRetrain: AutoRetrainSettings;
  storage: StorageDestinationSettings;
  production: ProductionGuardrailSettings;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  account: {
    isLoggedIn: true,
    username: 'Quant Architect',
    email: 'trader@fxforge.ai',
    tier: 'Enterprise Quant',
    licenseKey: 'FXF-ENT-9948-QUANT-2026',
    cloudSyncEnabled: true,
    lastSyncedAt: 'Just now',
  },
  compute: {
    device: 'auto',
    threads: 8,
    gpuMemoryGb: 6,
    precision: 'fp16',
    enableCudaGraphs: true,
    detectedGpuName: 'NVIDIA RTX 4090 / Apple Neural Engine (Available)',
  },
  autoRetrain: {
    enabled: true,
    trigger: 'drawdown',
    drawdownThresholdPct: 4.5,
    sharpeDecayThreshold: 1.2,
    scheduleInterval: 'weekly_sunday',
    retrainEpochs: 250,
    validationMinSharpe: 1.8,
    safetyRollback: true,
    autoDeployPassedModel: true,
  },
  storage: {
    exportDirectory: 'C:\\MetaTrader 5\\MQL5\\Experts\\FXFORGE_Models',
    backupDirectory: 'Z:\\FXFORGE_BACKUPS\\Checkpoints',
    autoExportMql5: true,
    autoExportOnnx: true,
    maxSnapshotsRetention: 10,
    fileNamingPattern: '{symbol}_{timeframe}_{strategy}_{date}',
  },
  production: {
    circuitBreakerMaxLossPct: 3.0,
    maxSpreadPips: 2.0,
    maxSlippagePips: 1.5,
    bridgeLatencyThresholdMs: 25,
    enableWebhooks: false,
    webhookUrl: 'https://discord.com/api/webhooks/...',
    alertOnRetrain: true,
    alertOnTrade: true,
    alertOnDrawdown: true,
    emergencyStopHotkey: 'Ctrl + Shift + X',
  },
};

const APP_SETTINGS_KEY = 'fxforge_app_settings_v2';

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
        account: { ...DEFAULT_APP_SETTINGS.account, ...(parsed.account || {}) },
        compute: { ...DEFAULT_APP_SETTINGS.compute, ...(parsed.compute || {}) },
        autoRetrain: { ...DEFAULT_APP_SETTINGS.autoRetrain, ...(parsed.autoRetrain || {}) },
        storage: { ...DEFAULT_APP_SETTINGS.storage, ...(parsed.storage || {}) },
        production: { ...DEFAULT_APP_SETTINGS.production, ...(parsed.production || {}) },
      };
    }
  } catch (e) {
    console.error('Failed to load application settings:', e);
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('fxforge-app-settings-updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save application settings:', e);
  }
}
