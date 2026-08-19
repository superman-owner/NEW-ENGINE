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
  x: number; // 3D coordinates in world space (roughly -200 to +200)
  y: number;
  z: number;
  lobe: BrainLobe;
  hemisphere: Hemisphere;
  label: string;
  subLabel: string;
  color: string;
  accentColor: string;
  size: number;
  membranePotential: number; // -70 to +40 mV
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

// Procedural 3D Human Brain Anatomy Generator
export function generate3DBrainTopology(): {
  nodes: Brain3DNode[];
  edges: Brain3DEdge[];
} {
  const nodes: Brain3DNode[] = [];
  const edges: Brain3DEdge[] = [];

  let nodeIndex = 0;

  // Helper to create an embedding vector
  const makeEmbedding = () =>
    Array.from({ length: 8 }, () => Math.round((Math.random() * 2 - 1) * 100) / 100);

  // 1. Left & Right Cerebral Hemispheres (Cortical Shell)
  const hemispheres: Array<{ hemi: Hemisphere; xSign: number; colorOffset: number }> = [
    { hemi: 'left', xSign: -1, colorOffset: 0 },
    { hemi: 'right', xSign: 1, colorOffset: 1 },
  ];

  hemispheres.forEach(({ hemi, xSign }) => {
    // Generate ~150 nodes per hemisphere
    for (let u = 0; u < Math.PI * 2; u += 0.32) {
      for (let v = 0.15; v < Math.PI - 0.2; v += 0.28) {
        // Anatomical Ellipsoid with Sulci & Gyri surface fold perturbation
        const foldNoise = Math.sin(u * 5) * Math.cos(v * 4) * 8 + Math.sin(v * 8) * 5;

        const baseRx = 85 + foldNoise;
        const baseRy = 65 + foldNoise;
        const baseRz = 105 + foldNoise;

        let px = xSign * (Math.abs(Math.cos(u)) * Math.sin(v) * baseRx + 18);
        let py = Math.cos(v) * baseRy - 15; // Y is up/down
        let pz = Math.sin(u) * Math.sin(v) * baseRz; // Z is front/back

        // Classify anatomical lobe based on Z (Anterior/Posterior) and Y (Superior/Inferior)
        let lobe: BrainLobe = 'parietal';
        let color = '#ffd60a'; // Default Gold
        let accent = 'rgba(255, 214, 10, 0.4)';
        let role = 'Associative Cortex';

        if (pz > 30) {
          // Anterior -> Frontal Lobe
          lobe = 'frontal';
          color = '#ffd60a'; // Golden Yellow (like BBC reference)
          accent = 'rgba(255, 214, 10, 0.5)';
          role = 'Alpha Strategy & Decision';
        } else if (pz < -35 && py > -10) {
          // Posterior -> Occipital Lobe
          lobe = 'occipital';
          color = '#bf5af2'; // Purple
          accent = 'rgba(191, 90, 242, 0.5)';
          role = 'Pattern Recognition & Wavelet';
        } else if (py < -15 && Math.abs(px) > 35) {
          // Lateral Inferior -> Temporal Lobe
          lobe = 'temporal';
          color = '#ff9f0a'; // Orange
          accent = 'rgba(255, 159, 10, 0.5)';
          role = 'Sequential Memory (LSTM)';
        } else {
          // Superior Dorsal -> Parietal Lobe
          lobe = 'parietal';
          color = '#64d2ff'; // Cyan
          accent = 'rgba(100, 210, 255, 0.5)';
          role = 'Spatial Covariance & Attention';
        }

        // Add subtle anatomical indentation for Sylvian fissure
        if (lobe === 'temporal') {
          py -= 10;
        }

        nodeIndex++;
        nodes.push({
          id: `node_${nodeIndex}`,
          x: px,
          y: py,
          z: pz,
          lobe,
          hemisphere: hemi,
          label: `${lobe.toUpperCase()}_${hemi[0].toUpperCase()}${nodeIndex}`,
          subLabel: role,
          color,
          accentColor: accent,
          size: Math.random() * 2 + 3.2,
          membranePotential: -70,
          isSpiking: false,
          embedding: makeEmbedding(),
          connections: [],
          attentionWeights: {},
        });
      }
    }
  });

  // 2. Cerebellum (Posterior-Inferior bilateral clusters)
  [-1, 1].forEach((xSign) => {
    for (let theta = 0; theta < Math.PI * 2; theta += 0.5) {
      for (let phi = 0.2; phi < Math.PI; phi += 0.45) {
        const r = 32 + Math.sin(theta * 4) * 3;
        const px = xSign * (Math.cos(theta) * Math.sin(phi) * r * 0.75 + 28);
        const py = Math.cos(phi) * r * 0.65 - 65; // Below occipital
        const pz = Math.sin(theta) * Math.sin(phi) * r * 0.8 - 60; // Posterior

        nodeIndex++;
        nodes.push({
          id: `node_${nodeIndex}`,
          x: px,
          y: py,
          z: pz,
          lobe: 'cerebellum',
          hemisphere: xSign < 0 ? 'left' : 'right',
          label: `CEREBELLUM_${nodeIndex}`,
          subLabel: 'Risk Shield & Circuit Breaker',
          color: '#30d158', // Green
          accentColor: 'rgba(48, 209, 88, 0.5)',
          size: Math.random() * 1.8 + 2.8,
          membranePotential: -70,
          isSpiking: false,
          embedding: makeEmbedding(),
          connections: [],
          attentionWeights: {},
        });
      }
    }
  });

  // 3. Brainstem (Central Inferior Column)
  for (let stemY = -45; stemY >= -115; stemY -= 12) {
    const stemRadius = 14 + (stemY + 115) * 0.15;
    for (let a = 0; a < Math.PI * 2; a += 1.0) {
      const px = Math.cos(a) * stemRadius + (Math.random() - 0.5) * 3;
      const py = stemY;
      const pz = Math.sin(a) * stemRadius - 15 + (Math.random() - 0.5) * 3;

      nodeIndex++;
      nodes.push({
        id: `node_${nodeIndex}`,
        x: px,
        y: py,
        z: pz,
        lobe: 'brainstem',
        hemisphere: 'central',
        label: `BRAIN_STEM_${nodeIndex}`,
        subLabel: 'HFT Ultra-Low Latency Flow',
        color: '#ff375f', // Rose / Red
        accentColor: 'rgba(255, 55, 95, 0.6)',
        size: Math.random() * 2 + 3.5,
        membranePotential: -70,
        isSpiking: false,
        embedding: makeEmbedding(),
        connections: [],
        attentionWeights: {},
      });
    }
  }

  // 4. Construct 3D Geometric Synaptic Edge Mesh (k-NN / Distance Threshold)
  const maxDistance = 42; // Maximum connection distance in 3D
  const maxConnectionsPerNode = 6;

  nodes.forEach((src) => {
    // Find closest nodes
    const neighbors: Array<{ id: string; dist: number }> = [];

    nodes.forEach((tgt) => {
      if (src.id === tgt.id) return;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dz = tgt.z - src.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < maxDistance) {
        neighbors.push({ id: tgt.id, dist });
      }
    });

    // Sort by distance and keep top k
    neighbors.sort((a, b) => a.dist - b.dist);
    const selectedNeighbors = neighbors.slice(0, maxConnectionsPerNode);

    selectedNeighbors.forEach(({ id: targetId, dist }) => {
      src.connections.push(targetId);
      const weight = Math.max(0.1, 1.0 - dist / maxDistance);
      src.attentionWeights[targetId] = Math.round(weight * 100) / 100;

      // Add edge once
      const edgeKey = [src.id, targetId].sort().join('--');
      if (!edges.some((e) => e.id === edgeKey)) {
        edges.push({
          id: edgeKey,
          sourceId: src.id,
          targetId,
          weight,
          distance: dist,
        });
      }
    });
  });

  return { nodes, edges };
}
