export type BrainLobe =
  | 'frontal'
  | 'temporal'
  | 'parietal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem';

export type Hemisphere = 'left' | 'right' | 'central';

export interface Brain3DNode {
  id: string;
  x: number; // 3D coordinates in range [-200, 200]
  y: number;
  z: number;
  lobe: BrainLobe;
  hemisphere: Hemisphere;
  label: string;
  subLabel: string;
  color: string;
  accentColor: string;
  size: number;
  membranePotential: number; // in mV (e.g. -70 to +40)
  isSpiking: boolean;
  embedding: number[]; // 8-dim latent vector
  connections: string[]; // Target node IDs
  attentionWeights: Record<string, number>;
}

export interface Brain3DEdge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  distance: number;
}

export interface GNNMessageParticle {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  vectorMagnitude: number;
}

export type GNNLayerType = 'GCN' | 'GAT' | 'GraphSAGE' | 'Neuromorphic_SNN';

export interface GNNControlState {
  layerType: GNNLayerType;
  messagePassingSpeed: number;
  autoRotate: boolean;
  rotationSpeed: number;
  activeLobes: Record<BrainLobe, boolean>;
  dopamine: number; // 0-100 (Alpha reinforcement)
  adrenaline: number; // 0-100 (Volatility & High Frequency Spikes)
  serotonin: number; // 0-100 (Stability)
  gaba: number; // 0-100 (Noise pruning)
  showWireframe: boolean;
  particleDensity: 'low' | 'medium' | 'high';
}

export interface EEGDataPoint {
  time: string;
  alpha: number;
  beta: number;
  gamma: number;
  theta: number;
}

export interface MembraneHistoryPoint {
  t: number;
  vm: number;
}
