import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeuralCanvas } from './NeuralCanvas';
import { NeuroModulationPanel } from './NeuroModulationPanel';
import { NeuralTelemetryHUD } from './NeuralTelemetryHUD';
import { generate3DBrainTopology } from './brainMeshGenerator';
import type {
  Brain3DNode,
  Brain3DEdge,
  GNNMessageParticle,
  GNNControlState,
  EEGDataPoint,
  MembraneHistoryPoint,
} from './types';

export const NervousSystemView: React.FC = () => {
  // 1. Procedural 3D Brain Connectome Mesh (400+ Nodes, 1,200+ Edges)
  const [brainData] = useState<{ nodes: Brain3DNode[]; edges: Brain3DEdge[] }>(() =>
    generate3DBrainTopology()
  );

  const [nodes, setNodes] = useState<Brain3DNode[]>(brainData.nodes);
  const [edges] = useState<Brain3DEdge[]>(brainData.edges);
  const [particles, setParticles] = useState<GNNMessageParticle[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_12');

  // 2. GNN & Neuromorphic Control State
  const [gnnState, setGnnState] = useState<GNNControlState>({
    layerType: 'GAT',
    messagePassingSpeed: 1.2,
    autoRotate: true,
    rotationSpeed: 1.0,
    activeLobes: {
      frontal: true,
      temporal: true,
      parietal: true,
      occipital: true,
      cerebellum: true,
      brainstem: true,
    },
    dopamine: 70,
    adrenaline: 40,
    serotonin: 75,
    gaba: 35,
    showWireframe: true,
    particleDensity: 'high',
  });

  // 3. Telemetry Stream States
  const [eegHistory, setEegHistory] = useState<EEGDataPoint[]>([]);
  const [membraneHistory, setMembraneHistory] = useState<MembraneHistoryPoint[]>([]);
  const [firingRateHz, setFiringRateHz] = useState(24.5);
  const [graphHomophily] = useState(0.88);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const particlesRef = useRef(particles);
  particlesRef.current = particles;
  const gnnStateRef = useRef(gnnState);
  gnnStateRef.current = gnnState;
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

  // Single Node Depolarization Current Injection
  const handleInjectCurrent = useCallback((nodeId: string, currentAmount: number) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const newVm = Math.min(40, n.membranePotential + currentAmount);
          return {
            ...n,
            membranePotential: newVm,
            isSpiking: newVm >= -55,
          };
        }
        return n;
      })
    );
  }, []);

  // Global Cortical Avalanche Shockwave
  const handleTriggerShockwave = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        membranePotential: 40,
        isSpiking: true,
      }))
    );
  }, []);

  // Main 60 FPS GNN Message Passing & Biological Simulation Loop
  useEffect(() => {
    let intervalId: number;
    let tickCount = 0;

    const runSimulationTick = () => {
      tickCount++;
      const currentNodes = [...nodesRef.current];
      const currentParticles = [...particlesRef.current];
      const state = gnnStateRef.current;
      const speed = state.messagePassingSpeed;

      const newParticles: GNNMessageParticle[] = [];
      let totalSpikesThisTick = 0;

      // 1. Update In-Flight GNN Message Particles
      currentParticles.forEach((p) => {
        const nextProgress = p.progress + 0.05 * speed;

        if (nextProgress < 1.0) {
          newParticles.push({
            ...p,
            progress: nextProgress,
          });
        } else {
          // Message Arrived at Target Node: Aggregate & Depolarize!
          const targetIndex = currentNodes.findIndex((n) => n.id === p.targetId);
          if (targetIndex !== -1) {
            const targetNode = currentNodes[targetIndex];
            const epsp = 20 * p.vectorMagnitude * (1 - state.gaba / 150);
            targetNode.membranePotential = Math.min(40, targetNode.membranePotential + epsp);
          }
        }
      });

      // 2. Random Background Cortical Spikes (Pacemaker)
      if (tickCount % Math.max(6, Math.floor(20 / speed)) === 0) {
        const randomNodeIndex = Math.floor(Math.random() * currentNodes.length);
        currentNodes[randomNodeIndex].membranePotential = 40;
      }

      // 3. Update 3D Node Membrane Potentials (Spike firing & leak)
      currentNodes.forEach((n) => {
        if (n.membranePotential >= -55 && !n.isSpiking) {
          // SPIKE FIRED!
          n.isSpiking = true;
          n.membranePotential = 40;
          totalSpikesThisTick++;

          // Propagate GNN Message Packets to all 3D connected neighbors
          n.connections.forEach((targetId) => {
            newParticles.push({
              id: `p-${n.id}-${targetId}-${Date.now()}-${Math.random()}`,
              sourceId: n.id,
              targetId,
              progress: 0,
              speed: 1.0,
              color: n.color,
              vectorMagnitude: n.attentionWeights[targetId] || 0.8,
            });
          });
        } else if (n.membranePotential > -70) {
          // Leaky decay
          n.membranePotential = Math.max(-70, n.membranePotential - 3.5 * speed);
          if (n.membranePotential < -55) {
            n.isSpiking = false;
          }
        }
      });

      // Limit max in-flight particles for 60 FPS performance
      const cappedParticles = newParticles.slice(-120);

      nodesRef.current = currentNodes;
      setNodes(currentNodes);
      particlesRef.current = cappedParticles;
      setParticles(cappedParticles);

      // 4. Update Telemetry Streams
      const monitoredId = selectedNodeIdRef.current || 'node_12';
      const monitoredNode = currentNodes.find((n) => n.id === monitoredId) || currentNodes[0];

      setMembraneHistory((prev) => {
        const updated = [...prev, { t: tickCount, vm: monitoredNode ? monitoredNode.membranePotential : -70 }];
        return updated.slice(-35);
      });

      setEegHistory((prev) => {
        const baseAlpha = 35 + Math.sin(tickCount * 0.15) * 15 + (state.dopamine / 100) * 20;
        const baseGamma = 25 + Math.cos(tickCount * 0.35) * 30 + (state.adrenaline / 100) * 35;
        const baseBeta = 20 + Math.sin(tickCount * 0.25) * 15;
        const baseTheta = 15 + Math.cos(tickCount * 0.1) * 10;

        const updated = [
          ...prev,
          {
            time: `${tickCount}`,
            alpha: baseAlpha,
            gamma: baseGamma,
            beta: baseBeta,
            theta: baseTheta,
          },
        ];
        return updated.slice(-25);
      });

      setFiringRateHz((prev) => {
        const target = 12 + totalSpikesThisTick * 3.5 + (state.adrenaline / 100) * 25;
        return prev * 0.85 + target * 0.15;
      });
    };

    intervalId = window.setInterval(runSimulationTick, 35);
    return () => clearInterval(intervalId);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex-1 w-full h-full flex overflow-hidden relative bg-[#030308]">
      {/* Left: GNN Architecture & 3D Lobe Control */}
      <NeuroModulationPanel
        gnnState={gnnState}
        onUpdateState={(updates) => setGnnState((prev) => ({ ...prev, ...updates }))}
        onTriggerShockwave={handleTriggerShockwave}
      />

      {/* Center: 3D Brain Mesh Canvas Engine */}
      <div className="flex-1 h-full relative">
        <NeuralCanvas
          nodes={nodes}
          edges={edges}
          particles={particles}
          gnnState={gnnState}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onInjectCurrent={handleInjectCurrent}
        />
      </div>

      {/* Right: GNN Graph Telemetry & Embedding HUD */}
      <NeuralTelemetryHUD
        selectedNode={selectedNode}
        totalNodes={nodes.length}
        totalEdges={edges.length}
        firingRateHz={firingRateHz}
        graphHomophily={graphHomophily}
        eegHistory={eegHistory}
        membraneHistory={membraneHistory}
        onInjectCurrent={handleInjectCurrent}
      />
    </div>
  );
};
