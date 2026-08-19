import { useState, useCallback, useEffect, useRef } from 'react';
import { AnalyticsDrawer } from './components/BottomPanel/AnalyticsDrawer';
import { TopNav } from './components/Header/TopNav';
import { MT5DeployModal } from './components/Modals/MT5DeployModal';
import { LiveNeuralLink } from './components/NeuralLink/LiveNeuralLink';
import { FlowCanvasView } from './components/Flow/FlowCanvasView';
import { MacOSAssistantSidebar } from './components/AIAssistant/MacOSAssistantSidebar';
import { RobotAvatar } from './components/AIAssistant/RobotAvatar';
import { NodePalette } from './components/Sidebar/NodePalette';
import { INITIAL_LOGS } from './data/mockAnalytics';
import { fxforgeEngine } from './services/fxforgeEngine';
import type { QuantTelemetry, RLEnvironmentStep } from './services/fxforgeEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FlowProvider, useFlow } from './context/FlowContext';

import { ProjectManagerModal } from './components/Modals/ProjectManagerModal';
import { AISettingsModal } from './components/Modals/AISettingsModal';
import { MainSettingsModal } from './components/Modals/MainSettingsModal';
import { ConfirmDialog } from './components/Modals/ConfirmDialog';
import {
  getSavedProjects,
  getActiveProjectId,
  exportProjectToFile,
  importProjectFromFile,
  saveCurrentProject,
  createNewBlankProject,
} from './services/projectService';

function AppContent() {
  const { theme } = useTheme();
  const { nodes, edges, setNodes, setEdges, architectureSpec, syncArchitectureToEngine } = useFlow();

  // Active View Switcher: 'bpnn' (Live 3D BPNN Visualizer) or 'studio' (Flow DAG)
  const [activeView, setActiveView] = useState<'studio' | 'bpnn'>('studio');

  // Sidebar Collapsed State (Active on both views, collapsible to the left)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  // RL Live Telemetry & Control State (START, PAUSE, STOP) - Default strictly 'stopped' (Standby)
  const [rlStatus, setRlStatus] = useState<'running' | 'paused' | 'stopped'>('stopped');
  const rlStatusRef = useRef(rlStatus);
  useEffect(() => {
    rlStatusRef.current = rlStatus;
  }, [rlStatus]);

  const [rlTelemetry, setRlTelemetry] = useState<QuantTelemetry>(() => {
    fxforgeEngine.reset();
    return fxforgeEngine.getTelemetry();
  });
  const [rlLatestStep, setRlLatestStep] = useState<RLEnvironmentStep | null>(null);
  const [isMT5DeployOpen, setIsMT5DeployOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isMainSettingsOpen, setIsMainSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('Untitled Project');
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [appAlert, setAppAlert] = useState<string | null>(null);
  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // Listen for blueprint loads to sync active project name
  useEffect(() => {
    const handleBlueprintLoad = (e: any) => {
      if (e.detail?.name) {
        setCurrentProjectName(e.detail.name);
      }
    };
    window.addEventListener('fxforge-load-blueprint', handleBlueprintLoad);
    return () => window.removeEventListener('fxforge-load-blueprint', handleBlueprintLoad);
  }, []);

  // Ensure stale processes are killed on fresh page boot
  useEffect(() => {
    fetch('/api/train/stop', { method: 'POST' }).catch(() => {});
  }, []);

  // Real-time PyTorch Backend Process Listeners (Pure Real Deep RL Engine via SSE / Electron IPC)
  useEffect(() => {
    const processStdout = (text: string) => {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      setLogs((prev) => [...prev.slice(-150), ...lines]);

      lines.forEach((line: string) => {
        if (line.includes('"type": "progress"')) {
          if (rlStatusRef.current !== 'running') return; // Read live ref so events are never dropped!
          try {
            const jsonStr = line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            const { telemetry, step } = fxforgeEngine.recordPyTorchProgress(data);
            setRlTelemetry(telemetry);
            setRlLatestStep(step);
          } catch (e) {}
        }
      });
    };

    const processStderr = (text: string) => {
      setLogs((prev) => [...prev.slice(-150), `[PYTORCH] ${text.trim()}`]);
    };

    const processFinished = (code: number) => {
      setLogs((prev) => [
        ...prev,
        `[PYTORCH] ✅ Real Training completed (Code: ${code}). Single-file ONNX model exported to MT5.`,
      ]);
    };

    // 1. Electron IPC Listener
    const electron = (window as any).electronAPI;
    let unsubOut: any, unsubErr: any, unsubDone: any;
    if (electron && typeof electron.on === 'function') {
      unsubOut = electron.on('training-stdout', processStdout);
      unsubErr = electron.on('training-stderr', processStderr);
      unsubDone = electron.on('training-finished', ({ code }: { code: number }) => processFinished(code));
    }

    // 2. Web Browser SSE Stream Listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/train/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'stdout') processStdout(data.text);
          else if (data.type === 'stderr') processStderr(data.text);
          else if (data.type === 'finished') processFinished(data.code);
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (typeof unsubOut === 'function') unsubOut();
      if (typeof unsubErr === 'function') unsubErr();
      if (typeof unsubDone === 'function') unsubDone();
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-switch to Studio Flow DAG view when dropping a node from Sidebar or loading an AI blueprint
  useEffect(() => {
    const handleSwitchToStudio = () => {
      if (activeView !== 'studio') {
        setActiveView('studio');
      }
    };
    window.addEventListener('fxforge-drop-node', handleSwitchToStudio);
    window.addEventListener('fxforge-load-blueprint', handleSwitchToStudio);
    return () => {
      window.removeEventListener('fxforge-drop-node', handleSwitchToStudio);
      window.removeEventListener('fxforge-load-blueprint', handleSwitchToStudio);
    };
  }, [activeView]);

  const handleStartRL = useCallback(() => {
    if (!nodes || nodes.length === 0) {
      setLogs((prev) => [
        ...prev,
        `[RL ENGINE] ⚠️ Cannot start simulation: Canvas has 0 nodes. Please add strategy / network nodes to canvas first.`,
      ]);
      return;
    }

    if (rlStatus === 'stopped') {
      fxforgeEngine.reset();
      setRlTelemetry(fxforgeEngine.getTelemetry());
      setRlLatestStep(null);
    }
    setRlStatus('running');
    setLogs((prev) => [
      ...prev,
      `[NODE PIPELINE] Applying Node Config: ${architectureSpec.strategyPreset} (${architectureSpec.symbol} ${architectureSpec.timeframe})`,
      `[NODE PIPELINE] Target Output: ${architectureSpec.targetFolder || 'MQL5/Files/'} (Opset ${architectureSpec.opsetVersion || 14})`,
      `[NODE PIPELINE] Layers: 6 -> ${architectureSpec.hidden1Units} (${architectureSpec.hidden1Activation}) -> Dropout(${architectureSpec.dropoutRate}) -> ${architectureSpec.hidden2Units} -> 3 Actions`,
      `[RL ENGINE] Launching Real PyTorch Training Engine (${architectureSpec.totalEpisodes || 400} Episodes)...`,
    ]);

    const payload = {
      symbol: architectureSpec.symbol,
      timeframe: architectureSpec.timeframe,
      bars_count: architectureSpec.barsCount,
      strategy_preset: architectureSpec.strategyPreset,
      target_folder: architectureSpec.targetFolder || 'MQL5/Files/',
      opset: architectureSpec.opsetVersion || 14,
      export_name: architectureSpec.exportName || 'rl_trading_model.onnx',
      hidden1_units: architectureSpec.hidden1Units,
      hidden1_activation: architectureSpec.hidden1Activation,
      has_dropout: architectureSpec.hasDropout,
      dropout_rate: architectureSpec.dropoutRate,
      has_layer_norm: architectureSpec.hasLayerNorm,
      has_l2_decay: architectureSpec.hasL2Decay,
      l2_decay_rate: architectureSpec.l2DecayRate,
      hidden2_units: architectureSpec.hidden2Units,
      hidden2_activation: architectureSpec.hidden2Activation,
      has_residual: architectureSpec.hasResidual,
      spread_pips: architectureSpec.spreadPips,
      inactivity_penalty: architectureSpec.inactivityPenalty,
      entropy_beta: architectureSpec.entropyBeta,
      total_episodes: architectureSpec.totalEpisodes || 400,
    };

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.startRealTraining === 'function') {
      electron.startRealTraining(payload);
    } else {
      // Trigger via Local Server API
      fetch('/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, [architectureSpec, nodes, rlStatus]);

  const handlePauseRL = useCallback(() => {
    setRlStatus('paused');
    setLogs((prev) => [...prev, `[RL ENGINE] Simulation paused.`]);
  }, []);

  const handleStopRL = useCallback(() => {
    setRlStatus('stopped');
    fxforgeEngine.reset();
    setRlTelemetry(fxforgeEngine.getTelemetry());
    setRlLatestStep(null);
    setLogs((prev) => [...prev, `[RL ENGINE] Training stopped and reset to baseline.`]);

    const electron = (window as any).electronAPI;
    if (electron && typeof electron.stopRealTraining === 'function') {
      electron.stopRealTraining();
    } else {
      fetch('/api/train/stop', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const handleNewProject = useCallback((preferredName?: string) => {
    // 1. Auto-save current project if it contains nodes and has a name
    if (nodes && nodes.length > 0) {
      try {
        const nameToPreserve = currentProjectName.trim() || 'Previous Strategy';
        saveCurrentProject(
          {
            name: nameToPreserve,
            type: 'Deep RL Policy',
            symbol: architectureSpec?.symbol || 'XAUUSD',
            timeframe: architectureSpec?.timeframe || 'M15',
            description: 'Auto-saved before creating new project.',
          },
          nodes,
          edges,
          architectureSpec
        );
        setLogs((prev) => [...prev, `[STUDIO] Auto-saved previous project "${nameToPreserve}" to Library.`]);
      } catch (e) {
        console.warn('Auto-save error during new project creation:', e);
      }
    }

    handleStopRL();

    // 2. Create brand new project entry
    const newProj = createNewBlankProject(preferredName || 'Untitled Project');
    setCurrentProjectName(newProj.name);
    setNodes([]);
    setEdges([]);

    try {
      localStorage.setItem('fxforge_dag_nodes_v9', JSON.stringify([]));
      localStorage.setItem('fxforge_dag_edges_v9', JSON.stringify([]));
      localStorage.setItem('fxforge_flow_nodes', JSON.stringify([]));
      localStorage.setItem('fxforge_flow_nodes_edges', JSON.stringify([]));
    } catch (_) {}

    // 3. Dispatch events to clear canvas view and sync project name
    window.dispatchEvent(
      new CustomEvent('fxforge-load-blueprint', {
        detail: {
          nodes: [],
          edges: [],
          name: newProj.name,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('fxforge-update-nodes', {
        detail: { nodes: [], edges: [] },
      })
    );
    setLogs((prev) => [...prev, `[STUDIO] Created new blank project "${newProj.name}" (ID: ${newProj.id}).`]);
  }, [handleStopRL, nodes, edges, currentProjectName, architectureSpec, setNodes, setEdges]);

  const handleSaveProjectDirect = useCallback(() => {
    const nameToSave = currentProjectName.trim() || 'Untitled Project';
    const saved = saveCurrentProject(
      {
        name: nameToSave,
        type: 'Deep RL Policy',
        symbol: architectureSpec?.symbol || 'XAUUSD',
        timeframe: architectureSpec?.timeframe || 'M15',
        description: 'Visual Reinforcement Learning Pipeline with Dynamic Actor-Critic NN',
      },
      nodes,
      edges,
      architectureSpec
    );

    setCurrentProjectName(saved.name);
    setLogs((prev) => [...prev, `[STUDIO] Saved strategy "${saved.name}" (${saved.id}) to Local Library.`]);
  }, [currentProjectName, nodes, edges, architectureSpec]);

  //  Full-System AI Command & Automation Dispatcher (AI Full Permission Control Hub)
  useEffect(() => {
    const handleAIStart = () => {
      handleStartRL();
    };
    const handleAIPause = () => {
      handlePauseRL();
    };
    const handleAIStop = () => {
      handleStopRL();
    };
    const handleAISave = (e: any) => {
      if (e.detail?.name) {
        setCurrentProjectName(e.detail.name);
      }
      handleSaveProjectDirect();
    };
    const handleAILoad = (e: any) => {
      const proj = e.detail?.project;
      if (proj) {
        if (Array.isArray(proj.nodes)) {
          setNodes(proj.nodes);
          setEdges(proj.edges || []);
          syncArchitectureToEngine(proj.nodes);
        }
        setCurrentProjectName(proj.name || 'Loaded Project');
        window.dispatchEvent(
          new CustomEvent('fxforge-load-blueprint', {
            detail: {
              nodes: proj.nodes || [],
              edges: proj.edges || [],
              name: proj.name,
            },
          })
        );
      }
    };
    const handleAIExport = () => {
      const nameToSave = currentProjectName.trim() || 'Untitled Project';
      const toExport = {
        id: `mt5-${Math.floor(1000 + Math.random() * 9000)}`,
        name: nameToSave,
        type: 'Deep RL Policy',
        language: 'MQL5',
        symbol: architectureSpec?.symbol || 'XAUUSD',
        timeframe: architectureSpec?.timeframe || 'M15',
        nodesCount: nodes.length,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        description: 'Exported strategy from FXFORGE Studio.',
        nodes,
        edges,
        architectureSpec,
      };
      exportProjectToFile(toExport as any);
      setLogs((prev) => [...prev, `[STUDIO] Exported strategy "${nameToSave}" as JSON file.`]);
    };
    const handleAIOpenModal = (e: any) => {
      const modal = e.detail?.modal;
      if (modal === 'deploy' || modal === 'mt5') setIsMT5DeployOpen(true);
      else if (modal === 'projects' || modal === 'manager') setIsProjectManagerOpen(true);
      else if (modal === 'settings' || modal === 'ai') setIsAISettingsOpen(true);
    };
    const handleAICloseModal = () => {
      setIsMT5DeployOpen(false);
      setIsProjectManagerOpen(false);
      setIsAISettingsOpen(false);
    };
    const handleAIResetCamera = () => {
      setCameraResetTrigger((prev) => prev + 1);
    };

    window.addEventListener('fxforge-ai-start-training', handleAIStart);
    window.addEventListener('fxforge-ai-pause-training', handleAIPause);
    window.addEventListener('fxforge-ai-stop-training', handleAIStop);
    window.addEventListener('fxforge-ai-save-project', handleAISave);
    window.addEventListener('fxforge-ai-load-project', handleAILoad);
    window.addEventListener('fxforge-ai-export-project', handleAIExport);
    window.addEventListener('fxforge-ai-open-modal', handleAIOpenModal);
    window.addEventListener('fxforge-ai-close-modal', handleAICloseModal);
    window.addEventListener('fxforge-ai-reset-camera', handleAIResetCamera);

    return () => {
      window.removeEventListener('fxforge-ai-start-training', handleAIStart);
      window.removeEventListener('fxforge-ai-pause-training', handleAIPause);
      window.removeEventListener('fxforge-ai-stop-training', handleAIStop);
      window.removeEventListener('fxforge-ai-save-project', handleAISave);
      window.removeEventListener('fxforge-ai-load-project', handleAILoad);
      window.removeEventListener('fxforge-ai-export-project', handleAIExport);
      window.removeEventListener('fxforge-ai-open-modal', handleAIOpenModal);
      window.removeEventListener('fxforge-ai-close-modal', handleAICloseModal);
      window.removeEventListener('fxforge-ai-reset-camera', handleAIResetCamera);
    };
  }, [handleStartRL, handlePauseRL, handleStopRL, handleSaveProjectDirect, currentProjectName, nodes, edges, architectureSpec, setNodes, setEdges, syncArchitectureToEngine]);

  // Global Windows shortcuts (Ctrl+S, Ctrl+N, Ctrl+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaveProjectDirect();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          handleNewProject();
        } else if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setIsProjectManagerOpen(true);
        } else if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsAssistantOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProjectDirect, handleNewProject]);

  const handleExportProjectDirect = useCallback(() => {
    const active = getSavedProjects().find((p) => p.id === getActiveProjectId()) || {
      id: `mt5-${Math.floor(1000 + Math.random() * 9000)}`,
      name: currentProjectName !== 'Untitled Project' ? currentProjectName : 'FXFORGE_Custom_Pipeline',
      type: 'Deep RL Policy' as const,
      language: 'MQL5' as const,
      symbol: architectureSpec?.symbol || 'XAUUSD',
      timeframe: architectureSpec?.timeframe || 'M15',
      nodesCount: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    exportProjectToFile(active);
    setLogs((prev) => [...prev, `[STUDIO] Exported project "${active.name}" to JSON file.`]);
  }, [architectureSpec, currentProjectName]);

  const handleFileImportDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProjectFromFile(file);
      if (imported.nodes && imported.nodes.length > 0) {
        setCurrentProjectName(imported.name);
        window.dispatchEvent(
          new CustomEvent('fxforge-load-blueprint', {
            detail: {
              nodes: imported.nodes,
              edges: imported.edges || [],
              name: imported.name,
            },
          })
        );
      }
      setLogs((prev) => [...prev, `[STUDIO] Imported and loaded strategy "${imported.name}".`]);
    } catch (err: any) {
      setAppAlert(`Import error: ${err.message}`);
    }
    if (fileImportInputRef.current) fileImportInputRef.current.value = '';
  };

  return (
    <div
      className={`h-screen w-screen overflow-auto custom-scrollbar font-sans select-none antialiased transition-colors duration-200 ${
        theme === 'light' ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-[#040407] text-slate-100'
      }`}
    >
      <div className="w-full h-full min-w-[1240px] min-h-[620px] flex flex-col relative overflow-hidden">
        {/* Hidden File Input for direct TopNav import */}
        <input
          type="file"
          ref={fileImportInputRef}
          onChange={handleFileImportDirect}
          accept=".json,.xml"
          className="hidden"
        />

        {/*  Top Navigation Bar */}
        <TopNav
          activeView={activeView}
          onViewChange={setActiveView}
          rlStatus={rlStatus}
          onStartRL={handleStartRL}
          onPauseRL={handlePauseRL}
          onStopRL={handleStopRL}
          rlTelemetry={rlTelemetry}
          rlLatestStep={rlLatestStep}
          onOpenMT5Deploy={() => setIsMT5DeployOpen(true)}
          onResetCamera={() => setCameraResetTrigger((prev) => prev + 1)}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          onSaveProject={handleSaveProjectDirect}
          onNewProject={handleNewProject}
          onExportProject={handleExportProjectDirect}
          onImportProject={() => fileImportInputRef.current?.click()}
          projectName={currentProjectName}
          onProjectNameChange={(newName) => {
            setCurrentProjectName(newName);
            setLogs((prev) => [...prev, `[STUDIO] Renamed project to "${newName}".`]);
          }}
          nodesCount={nodes?.length || 0}
        />

        {/*  Main Quantum Visualizer & Flow DAG Stage with Shared Left Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Shared Sidebar (Slim Rail when Collapsed, Full Tree when Expanded) */}
          <NodePalette
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            onOpenSettings={() => setIsMainSettingsOpen(true)}
            isTraining={rlStatus === 'running'}
          />

          <main
            className={`flex-1 h-full relative overflow-hidden transition-colors duration-200 ${
              theme === 'light' ? 'bg-[#f5f5f7]' : 'bg-[#040407]'
            }`}
          >
            <div className={`w-full h-full ${activeView === 'studio' ? 'block' : 'hidden'}`}>
              <FlowCanvasView isTraining={rlStatus === 'running'} />
            </div>
            <div className={`w-full h-full ${activeView === 'bpnn' ? 'block' : 'hidden'}`}>
              <LiveNeuralLink
                isTraining={rlStatus === 'running'}
                latestStep={rlLatestStep}
                cameraResetTrigger={cameraResetTrigger}
              />
            </div>

            {/*  Dynamic Multi-Emotion Robot Avatar Trigger Button (Hidden when assistant is open to never overlap input!) */}
            {!isAssistantOpen && (
              <button
                id="btn-open-assistant"
                onClick={() => setIsAssistantOpen(true)}
                className="absolute bottom-4 right-4 z-30 flex flex-col items-center justify-center p-0 transition-all duration-300 cursor-pointer select-none outline-none border-none bg-transparent hover:scale-115 hover:-translate-y-1 active:scale-95"
                title="Open AI Assistant (Ctrl + K)"
              >
                <RobotAvatar
                  size="md"
                  autoEmotion={true}
                />
              </button>
            )}

            {/*  macOS Theme Right Slide-Over AI Assistant Sidebar (Contained strictly above bottom drawer) */}
            <MacOSAssistantSidebar
              isOpen={isAssistantOpen}
              onClose={() => setIsAssistantOpen(false)}
              onOpenSettings={() => setIsAISettingsOpen(true)}
            />
          </main>
        </div>

        {/*  Bottom Persistent Analytics Drawer */}
        <AnalyticsDrawer
          logs={logs}
          isRunning={rlStatus === 'running'}
          rlStatus={rlStatus}
          rlTelemetry={rlTelemetry}
          latestStep={rlLatestStep}
        />
      </div>

      {/*  Main System Settings Modal (Account, Compute CPU/GPU, Auto-Retrain, Storage, Production) */}
      <MainSettingsModal
        isOpen={isMainSettingsOpen}
        onClose={() => setIsMainSettingsOpen(false)}
      />

      {/*  Dedicated AI Assistant API Settings Modal (Opened from Copilot Header Gear Icon) */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />

      {/*  FxDreema-Style Load Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onNewProject={handleNewProject}
        currentProjectName={currentProjectName}
      />

      {/*  MT5 One-Click Deploy Modal */}
      <MT5DeployModal
        isOpen={isMT5DeployOpen}
        onClose={() => setIsMT5DeployOpen(false)}
      />

      {/*  In-App Alert Dialog */}
      <ConfirmDialog
        isOpen={Boolean(appAlert)}
        type="warning"
        title="Import Error"
        message={appAlert || ''}
        confirmText="OK"
        onConfirm={() => setAppAlert(null)}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <FlowProvider>
        <AppContent />
      </FlowProvider>
    </ThemeProvider>
  );
}

export default App;

