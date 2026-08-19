import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  BarChart3, 
  FileCode2 
} from 'lucide-react';
import { TopNavbar } from './components/TopNavbar';
import { SidebarControls } from './components/SidebarControls';
import { MasterTachometer } from './components/MasterTachometer';
import { WalkForwardChart } from './components/WalkForwardChart';
import { Neural3DLink } from './components/Neural3DLink';
import { TradesJournal } from './components/TradesJournal';
import { MonteCarloStressTest } from './components/MonteCarloStressTest';
import { LiveTensorBar } from './components/LiveTensorBar';
import { CreatePresetModal } from './components/CreatePresetModal';
import { EngineSettingsModal } from './components/EngineSettingsModal';
import { PPOEngine } from './services/ppoEngine';
import { generateMQL5Expert } from './services/onnxMql5Generator';
import type { StrategyPreset, EpochTelemetry, TradeRecord, QuantFeatures, EngineSettings } from './types/ppo';

const INITIAL_PRESETS: StrategyPreset[] = [
  {
    id: 'gold_institutional_ppo',
    name: '🥇 Gold Institutional PPO (XAUUSD)',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    bars: '10,000',
    episodes: 300,
    modelType: 'PPO Actor-Critic (12 Quant Features)',
    description: 'High-Frequency Gold Scalper with GAE Advantage & Drawdown Guard',
    spread: 0.00015,
    actorLr: 0.0003,
    criticLr: 0.0010,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'bpnn_4layer_alpha',
    name: '🔮 1. BPNN 4-Layer Alpha Strategy (5➔6➔6➔3)',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    bars: '10,000',
    episodes: 350,
    modelType: 'Standalone BPNN (Rprop+)',
    description: '5-Pillar Features to 4-Layer Backpropagation Neural Network & MT5 Bot',
    spread: 0.00015,
    actorLr: 0.0005,
    criticLr: 0.0015,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'lightgbm_triple_barrier',
    name: '🧠 2. LightGBM + Triple Barrier Alpha',
    symbol: 'BTCUSD',
    timeframe: 'M15',
    bars: '20,000',
    episodes: 300,
    modelType: 'LightGBM + Triple Barrier',
    description: 'Triple-Barrier labeling with Purged Walk-Forward CV & LightGBM',
    spread: 0.00030,
    actorLr: 0.0003,
    criticLr: 0.0010,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'lstm_deep_sequence',
    name: '🌊 3. PyTorch Neural Sequence (LSTM Deep)',
    symbol: 'ETHUSD',
    timeframe: 'H1',
    bars: '20,000',
    episodes: 400,
    modelType: 'PyTorch LSTM (60-bar Lookback)',
    description: 'Multi-scale sequence modeling with Lookback Window of 60 bars',
    spread: 0.00025,
    actorLr: 0.0002,
    criticLr: 0.0008,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'fx_fast_scalper',
    name: '⚡ 4. FX Multi-Horizon PPO (EURUSD)',
    symbol: 'EURUSD',
    timeframe: 'M15',
    bars: '10,000',
    episodes: 250,
    modelType: 'PPO Actor-Critic (12 Quant Features)',
    description: 'Low-friction Forex Scalper optimized for London/NY overlaps',
    spread: 0.00008,
    actorLr: 0.0003,
    criticLr: 0.0010,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'crypto_momentum',
    name: '🚀 5. Crypto Momentum Trend (BTCUSD)',
    symbol: 'BTCUSD',
    timeframe: 'H1',
    bars: '20,000',
    episodes: 450,
    modelType: 'PPO Actor-Critic (12 Quant Features)',
    description: 'High-volatility momentum surfer with Volatility & EMA filtering',
    spread: 0.00035,
    actorLr: 0.0004,
    criticLr: 0.0012,
    clipEps: 0.25,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
  {
    id: 'volatility_orderflow_breaker',
    name: '💎 6. Volatility & Orderflow Breaker (US30)',
    symbol: 'US30',
    timeframe: 'M5',
    bars: '15,000',
    episodes: 350,
    modelType: 'PPO Actor-Critic (12 Quant Features)',
    description: 'Intraday US30 Dow Jones volatility expansion capture',
    spread: 0.00020,
    actorLr: 0.0003,
    criticLr: 0.0010,
    clipEps: 0.20,
    gamma: 0.99,
    gaeLambda: 0.95,
  },
];

const INITIAL_TELEMETRY: EpochTelemetry = {
  epoch: 0,
  trainReward: 0.0,
  valReward: 0.0,
  ma10Reward: 0.0,
  actorLoss: 0.0,
  criticLoss: 0.0,
  entropy: 0.02,
  winRate: 0.0,
  cumReturn: 0.0,
  sharpe: 0.0,
  sortino: 0.0,
  maxDrawdown: 0.0,
  profitFactor: 0.0,
  totalTrades: 0,
  actionDist: { hold: 100.0, buy: 0.0, sell: 0.0 },
};

const INITIAL_QUANT: QuantFeatures = {
  ret1: 0.0,
  ret3: 0.0,
  ret8: 0.0,
  ret21: 0.0,
  rsi14: 0.0,
  volAtr: 0.0,
  emaDist: 0.0,
  bbPctB: 0.0,
  sessionSin: 0.0,
  sessionCos: 1.0,
  posState: 0.0,
  unrealizedPnl: 0.0,
};

export const App: React.FC = () => {
  const [presets, setPresets] = useState<StrategyPreset[]>(INITIAL_PRESETS);
  const [currentPreset, setCurrentPreset] = useState<StrategyPreset>(INITIAL_PRESETS[0]);
  
  const [symbol, setSymbol] = useState(INITIAL_PRESETS[0].symbol);
  const [timeframe, setTimeframe] = useState(INITIAL_PRESETS[0].timeframe);
  const [bars, setBars] = useState(INITIAL_PRESETS[0].bars);
  const [episodes, setEpisodes] = useState(INITIAL_PRESETS[0].episodes);
  const [actorLr, setActorLr] = useState(INITIAL_PRESETS[0].actorLr);
  const [criticLr, setCriticLr] = useState(INITIAL_PRESETS[0].criticLr);
  const [clipEps, setClipEps] = useState(INITIAL_PRESETS[0].clipEps);

  const [activeTab, setActiveTab] = useState<'chart' | 'neural' | 'journal' | 'montecarlo'>('chart');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [telemetry, setTelemetry] = useState<EpochTelemetry>(INITIAL_TELEMETRY);
  const [quantVector, setQuantVector] = useState<QuantFeatures>(INITIAL_QUANT);
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  const [trainHistory, setTrainHistory] = useState<number[]>([]);
  const [valHistory, setValHistory] = useState<number[]>([]);
  const [maHistory, setMaHistory] = useState<number[]>([]);

  const [isCreatePresetOpen, setIsCreatePresetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<EngineSettings>({
    spreadPips: 1.5,
    slippagePips: 0.5,
    maxDrawdownLimit: 3.0,
    idlePenalty: 0.00003,
    opportunityCost: 0.35,
    mt5Directory: 'C:/Users/ASUS/AppData/Roaming/MetaQuotes/Terminal/Common/Files',
    autoDeployOnComplete: true,
  });

  const engineRef = useRef(new PPOEngine());

  const handleSelectPreset = (preset: StrategyPreset) => {
    setCurrentPreset(preset);
    setSymbol(preset.symbol);
    setTimeframe(preset.timeframe);
    setBars(preset.bars);
    setEpisodes(preset.episodes);
    setActorLr(preset.actorLr);
    setCriticLr(preset.criticLr);
    setClipEps(preset.clipEps);
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainHistory([]);
    setValHistory([]);
    setMaHistory([]);
    setTrades([]);

    const nBars = parseInt(bars.replace(/,/g, '')) || 10000;
    engineRef.current.initPrices(symbol, nBars);

    engineRef.current.runSimulation(
      episodes,
      (newTel, newTrades, latestQuant) => {
        setTelemetry(newTel);
        setQuantVector(latestQuant);
        setTrades(newTrades);
        setTrainingProgress((newTel.epoch / episodes) * 100);

        setTrainHistory((prev) => [...prev, newTel.trainReward]);
        setValHistory((prev) => [...prev, newTel.valReward]);
        setMaHistory((prev) => [...prev, newTel.ma10Reward]);
      },
      () => {
        setIsTraining(false);
      }
    );
  };

  const handleStopTraining = () => {
    engineRef.current.stop();
    setIsTraining(false);
  };

  const handleExportMql5 = () => {
    const code = generateMQL5Expert(symbol, 112233);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ONNX_RL_Trader_${symbol}.mq5`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeployMT5 = () => {
    handleExportMql5();
    alert(`🚀 PPO Model & Expert Advisor Ready!\n\nDownloaded ONNX_RL_Trader_${symbol}.mq5 for immediate execution on your MetaTrader 5 chart.`);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white">
      {/* Top Navbar */}
      <TopNavbar
        presets={presets}
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        onOpenCreatePreset={() => setIsCreatePresetOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportMql5={handleExportMql5}
        onDeployMT5={handleDeployMT5}
        isTraining={isTraining}
        trainingProgress={trainingProgress}
      />

      {/* Main Studio Cockpit */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Controls */}
        <SidebarControls
          presets={presets}
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          onOpenCreatePreset={() => setIsCreatePresetOpen(true)}
          symbol={symbol}
          setSymbol={setSymbol}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          bars={bars}
          setBars={setBars}
          episodes={episodes}
          setEpisodes={setEpisodes}
          actorLr={actorLr}
          setActorLr={setActorLr}
          criticLr={criticLr}
          setCriticLr={setCriticLr}
          clipEps={clipEps}
          setClipEps={setClipEps}
          isTraining={isTraining}
          onStartTraining={handleStartTraining}
          onStopTraining={handleStopTraining}
        />

        {/* Center Main Stage Viewport */}
        <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-black">
          {/* Top Master Tachometer & KPI Matrix Card */}
          <MasterTachometer telemetry={telemetry} />

          {/* Viewport Multi-Tab Switcher */}
          <div className="flex items-center justify-between border-b border-[#1c1c24] pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'chart'
                    ? 'bg-[#007aff] text-white shadow-lg shadow-blue-950/50'
                    : 'bg-[#0c0c10] text-[#86868b] hover:text-white border border-[#1c1c24]'
                }`}
              >
                📈 RL Reward Curve & Telemetry
              </button>
              <button
                onClick={() => setActiveTab('neural')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'neural'
                    ? 'bg-[#007aff] text-white shadow-lg shadow-blue-950/50'
                    : 'bg-[#0c0c10] text-[#86868b] hover:text-white border border-[#1c1c24]'
                }`}
              >
                🔮 3D Neural Link (12-Feature PPO)
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'journal'
                    ? 'bg-[#007aff] text-white shadow-lg shadow-blue-950/50'
                    : 'bg-[#0c0c10] text-[#86868b] hover:text-white border border-[#1c1c24]'
                }`}
              >
                📋 Live Execution Journal
              </button>
              <button
                onClick={() => setActiveTab('montecarlo')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'montecarlo'
                    ? 'bg-[#007aff] text-white shadow-lg shadow-blue-950/50'
                    : 'bg-[#0c0c10] text-[#86868b] hover:text-white border border-[#1c1c24]'
                }`}
              >
                🛡️ Monte Carlo Stress Test
              </button>
            </div>

            {/* Quick Epoch Tracker */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#86868b]">
              <span>Epoch: <strong className="text-white">{telemetry.epoch}</strong>/{episodes}</span>
              <span>Actor Loss: <strong className="text-[#007aff]">{telemetry.actorLoss.toFixed(4)}</strong></span>
            </div>
          </div>

          {/* Active Tab Viewport Content */}
          <div className="flex-1 min-h-[360px]">
            {activeTab === 'chart' && (
              <WalkForwardChart
                trainHistory={trainHistory}
                valHistory={valHistory}
                maHistory={maHistory}
                latestReward={telemetry.trainReward}
                latestValReward={telemetry.valReward}
              />
            )}
            {activeTab === 'neural' && (
              <Neural3DLink
                quantVector={quantVector}
                actionProbs={telemetry.actionDist}
                isTraining={isTraining}
              />
            )}
            {activeTab === 'journal' && <TradesJournal trades={trades} />}
            {activeTab === 'montecarlo' && <MonteCarloStressTest telemetry={telemetry} />}
          </div>
        </main>
      </div>

      {/* Bottom Live 12-Dimensional Tensor Bar */}
      <LiveTensorBar quantVector={quantVector} />

      {/* Modals */}
      <CreatePresetModal
        isOpen={isCreatePresetOpen}
        onClose={() => setIsCreatePresetOpen(false)}
        onSave={(newPreset) => {
          setPresets((prev) => [newPreset, ...prev]);
          handleSelectPreset(newPreset);
        }}
      />

      <EngineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />
    </div>
  );
};
