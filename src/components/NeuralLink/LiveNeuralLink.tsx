import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Plus, Minus, Scan } from 'lucide-react';
import type { RLEnvironmentStep } from '../../services/fxforgeEngine';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';

interface BPNeuron {
  id: string;
  layerIdx: number;
  neuronIdx: number;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  z: number;
  activation: number;
  pulse: number;
}

interface BPSynapse {
  id: string;
  sourceLayer: number;
  sourceIdx: number;
  targetLayer: number;
  targetIdx: number;
  weight: number;
  isResidual?: boolean;
}

interface SignalParticle {
  id: string;
  sourceX: number;
  sourceY: number;
  sourceZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  speed: number;
  color: string;
}

interface LiveNeuralLinkProps {
  isTraining?: boolean;
  latestStep?: RLEnvironmentStep | null;
  cameraResetTrigger?: number;
}

export const LiveNeuralLink: React.FC<LiveNeuralLinkProps> = ({
  isTraining = true,
  latestStep = null,
  cameraResetTrigger = 0,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { architectureSpec } = useFlow();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const neuronsRef = useRef<BPNeuron[]>([]);
  const synapsesRef = useRef<BPSynapse[]>([]);
  const particlesRef = useRef<SignalParticle[]>([]);

  // Camera 3D Orbital Controls (Default Zoom: 75%, Auto-rotation OFF)
  const cameraRef = useRef({ rotX: 0.14, rotY: -0.22, zoom: 0.75, panX: 0, panY: 0 });
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef<number>(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isTrainingRef = useRef(isTraining);
  const latestStepRef = useRef<RLEnvironmentStep | null>(latestStep);

  // Zoom State (Default: 75%)
  const [, setZoomDisplay] = useState(75);

  // Sync refs
  useEffect(() => {
    isTrainingRef.current = isTraining;
  }, [isTraining]);

  useEffect(() => {
    latestStepRef.current = latestStep;
  }, [latestStep]);

  // Camera Reset Handlers (Reset to Default 75%)
  const handleResetView = useCallback(() => {
    cameraRef.current = { rotX: 0.14, rotY: -0.22, zoom: 0.75, panX: 0, panY: 0 };
    setZoomDisplay(75);
  }, []);

  const handleZoomIn = useCallback(() => {
    cameraRef.current.zoom = Math.min(2.5, Math.round((cameraRef.current.zoom + 0.12) * 100) / 100);
    setZoomDisplay(Math.round(cameraRef.current.zoom * 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    cameraRef.current.zoom = Math.max(0.35, Math.round((cameraRef.current.zoom - 0.12) * 100) / 100);
    setZoomDisplay(Math.round(cameraRef.current.zoom * 100));
  }, []);

  // Reset Camera Trigger from TopNav
  useEffect(() => {
    if (cameraResetTrigger > 0) {
      handleResetView();
    }
  }, [cameraResetTrigger, handleResetView]);

  // 1. Initialize Neural Network Geometry dynamically based on DAG Architecture
  useEffect(() => {
    const h1VisualCount = Math.max(6, Math.min(16, Math.round(architectureSpec.hidden1Units / 5)));
    const h2VisualCount = Math.max(4, Math.min(12, Math.round(architectureSpec.hidden2Units / 4)));
    const layerSizes = [
      architectureSpec.inputLabels.length, // 6
      h1VisualCount,                      // ~12
      h2VisualCount,                      // ~8
      architectureSpec.outputClasses.length // 3
    ];
    const neurons: BPNeuron[] = [];
    const synapses: BPSynapse[] = [];

    const inputLabels = architectureSpec.inputLabels;
    const outputLabels = architectureSpec.outputClasses;

    const layerSpacingX = 240;
    const originX = -((layerSizes.length - 1) * layerSpacingX) / 2;

    for (let l = 0; l < layerSizes.length; l++) {
      const count = layerSizes[l];
      const spacingY = Math.min(65, 380 / count);
      const originY = -((count - 1) * spacingY) / 2;

      for (let i = 0; i < count; i++) {
        const x = originX + l * layerSpacingX;
        const y = originY + i * spacingY;
        const z = (Math.sin((l / 3) * Math.PI) * 50 - 25) + (i % 2 === 0 ? 15 : -15);

        let label = `N_${l}_${i}`;
        let subLabel = '';
        if (l === 0) {
          label = inputLabels[i] || `In_${i}`;
          subLabel = 'State Vector';
        } else if (l === 1) {
          label = `h1_${i}`;
          subLabel = `${architectureSpec.hidden1Units}D (${architectureSpec.hidden1Activation})`;
        } else if (l === 2) {
          label = `h2_${i}`;
          subLabel = `${architectureSpec.hidden2Units}D (${architectureSpec.hidden2Activation})`;
        } else if (l === layerSizes.length - 1) {
          label = outputLabels[i] || `Act_${i}`;
          subLabel = 'Policy Action';
        }

        neurons.push({
          id: `neuron_${l}_${i}`,
          layerIdx: l,
          neuronIdx: i,
          label,
          subLabel,
          x,
          y,
          z,
          activation: Math.random() * 0.4 + 0.1,
          pulse: 0,
        });
      }
    }

    // Connect Fully Connected Dense Synapses
    for (let l = 0; l < layerSizes.length - 1; l++) {
      const currCount = layerSizes[l];
      const nextCount = layerSizes[l + 1];

      for (let i = 0; i < currCount; i++) {
        for (let j = 0; j < nextCount; j++) {
          synapses.push({
            id: `syn_${l}_${i}_${j}`,
            sourceLayer: l,
            sourceIdx: i,
            targetLayer: l + 1,
            targetIdx: j,
            weight: (Math.random() * 2 - 1) * 0.85,
            isResidual: false,
          });
        }
      }
    }

    // Add Dynamic Residual Skip Synapses from Layer 1 -> Layer 2 if enabled
    if (architectureSpec.hasResidual) {
      const l1Count = layerSizes[1];
      const l2Count = layerSizes[2];
      for (let i = 0; i < l1Count; i += 2) {
        const j = Math.min(l2Count - 1, Math.floor((i / l1Count) * l2Count));
        synapses.push({
          id: `res_syn_1_${i}_${j}`,
          sourceLayer: 1,
          sourceIdx: i,
          targetLayer: 2,
          targetIdx: j,
          weight: 0.85,
          isResidual: true,
        });
      }
    }

    neuronsRef.current = neurons;
    synapsesRef.current = synapses;
  }, [architectureSpec]);

  // 2. Real-time Activation Update from Global Latest Step (Syncing with Topbar and Real Forward Pass)
  useEffect(() => {
    if (!latestStep) return;
    const neurons = neuronsRef.current;
    if (neurons.length === 0) return;

    // State inputs (Layer 0)
    const stateVals = [
      Math.min(1, Math.abs(latestStep.state.ret5) / 2),
      Math.min(1, Math.abs(latestStep.state.ret10) / 3),
      Math.min(1, Math.abs(latestStep.state.ret20) / 4),
      Math.min(1, latestStep.state.volat10 / 1.5),
      Math.min(1, Math.abs(latestStep.state.distSma20) / 2),
      (latestStep.state.pos + 1) / 2,
    ];

    neurons.filter((n) => n.layerIdx === 0).forEach((n, idx) => {
      n.activation = stateVals[idx] ?? 0.3;
    });

    // Hidden Layer 1 Activations with Dropout
    const h1Neurons = neurons.filter((n) => n.layerIdx === 1);
    h1Neurons.forEach((n, idx) => {
      const isDropped = latestStep.dropoutMask?.[idx % (latestStep.dropoutMask.length || 1)] || false;
      if (isDropped) {
        n.activation = 0;
      } else {
        const actVal = latestStep.hidden1Activations?.[idx % (latestStep.hidden1Activations.length || 1)];
        n.activation = actVal !== undefined ? Math.min(1, Math.max(0.05, Math.abs(actVal))) : Math.random() * 0.5 + 0.2;
      }
    });

    // Hidden Layer 2 Activations
    const h2Neurons = neurons.filter((n) => n.layerIdx === 2);
    h2Neurons.forEach((n, idx) => {
      const actVal = latestStep.hidden2Activations?.[idx % (latestStep.hidden2Activations.length || 1)];
      n.activation = actVal !== undefined ? Math.min(1, Math.max(0.05, Math.abs(actVal))) : Math.random() * 0.5 + 0.2;
    });

    // Action outputs (Softmax Probabilities)
    const outNeurons = neurons.filter((n) => n.layerIdx === 3);
    outNeurons.forEach((n, idx) => {
      n.activation = latestStep.actionProbs[idx] ?? 0.33;
    });

    // Trigger synchronized photonic pulse on active action node
    const chosenNeuron = outNeurons.find((n) => n.neuronIdx === latestStep.action);
    if (chosenNeuron) {
      chosenNeuron.pulse = 1.0;
      const actionColor =
        latestStep.action === 0
          ? 'rgba(40, 205, 65, 0.95)'
          : latestStep.action === 1
          ? 'rgba(255, 159, 10, 0.95)'
          : 'rgba(255, 59, 48, 0.95)';

      h2Neurons.forEach((hn) => {
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            id: `sig_sync_${Date.now()}_${hn.id}_${Math.random()}`,
            sourceX: hn.x,
            sourceY: hn.y,
            sourceZ: hn.z,
            targetX: chosenNeuron.x,
            targetY: chosenNeuron.y,
            targetZ: chosenNeuron.z,
            progress: 0,
            speed: 0.045 + Math.random() * 0.02,
            color: actionColor,
          });
        }
      });
    }
  }, [latestStep]);

  // 3. Spawn Signal Pulses
  const spawnSignals = useCallback(() => {
    if (!isTrainingRef.current) return;
    const neurons = neuronsRef.current;
    if (neurons.length === 0) return;
    const currentIsLight = themeRef.current === 'light';

    // A. Forward Pass Pulses (Left -> Right)
    if (Math.random() < 0.45) {
      const startLayer = Math.floor(Math.random() * 3);
      const layerSources = neurons.filter((n) => n.layerIdx === startLayer);
      const layerTargets = neurons.filter((n) => n.layerIdx === startLayer + 1);

      if (layerSources.length > 0 && layerTargets.length > 0) {
        const src = layerSources[Math.floor(Math.random() * layerSources.length)];
        const tgt = layerTargets[Math.floor(Math.random() * layerTargets.length)];

        particlesRef.current.push({
          id: `sig_fwd_${Date.now()}_${Math.random()}`,
          sourceX: src.x,
          sourceY: src.y,
          sourceZ: src.z,
          targetX: tgt.x,
          targetY: tgt.y,
          targetZ: tgt.z,
          progress: 0,
          speed: 0.022 + Math.random() * 0.015,
          color: currentIsLight ? 'rgba(0, 113, 227, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        });
      }
    }

    // B. Backpropagation Gradients (Right -> Left)
    if (Math.random() < 0.25) {
      const endLayer = 1 + Math.floor(Math.random() * 3);
      const layerSources = neurons.filter((n) => n.layerIdx === endLayer);
      const layerTargets = neurons.filter((n) => n.layerIdx === endLayer - 1);

      if (layerSources.length > 0 && layerTargets.length > 0) {
        const src = layerSources[Math.floor(Math.random() * layerSources.length)];
        const tgt = layerTargets[Math.floor(Math.random() * layerTargets.length)];

        particlesRef.current.push({
          id: `sig_bwd_${Date.now()}_${Math.random()}`,
          sourceX: src.x,
          sourceY: src.y,
          sourceZ: src.z,
          targetX: tgt.x,
          targetY: tgt.y,
          targetZ: tgt.z,
          progress: 0,
          speed: 0.028 + Math.random() * 0.015,
          color: currentIsLight ? 'rgba(175, 82, 222, 0.95)' : 'rgba(10, 132, 255, 0.95)',
        });
      }
    }
  }, []);

  // 4. Main 60 FPS Render Loop (Aspect-Preserving 3D Projection)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    });

    resizeObserver.observe(container);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const currentIsLight = themeRef.current === 'light';

      ctx.save();
      ctx.scale(dpr, dpr);

      // Apple Studio Light Canvas vs Deep Obsidian Canvas
      if (currentIsLight) {
        const bgGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          50,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.8
        );
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.65, '#f5f5f7');
        bgGrad.addColorStop(1, '#e5e5ea');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Apple Light Grid Accents
        ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
        for (let gx = 20; gx < width; gx += 40) {
          for (let gy = 20; gy < height; gy += 40) {
            ctx.fillRect(gx, gy, 1.2, 1.2);
          }
        }
      } else {
        const bgGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          50,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        bgGrad.addColorStop(0, '#0b0b14');
        bgGrad.addColorStop(1, '#040407');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Camera Matrix Transformations
      const cam = cameraRef.current;

      const cosX = Math.cos(cam.rotX);
      const sinX = Math.sin(cam.rotX);
      const cosY = Math.cos(cam.rotY);
      const sinY = Math.sin(cam.rotY);
      const fov = 750;
      const centerX = width / 2 + cam.panX;
      const centerY = height / 2 + cam.panY;

      // 3D Point Projection Function
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + 500;
        const scale = (fov / Math.max(10, z2)) * cam.zoom;
        return {
          px: centerX + x1 * scale,
          py: centerY + y1 * scale,
          scale,
          depth: z2,
        };
      };

      spawnSignals();

      // Draw Synapses (Crisp Optical Neural Filaments with Dynamic Action Flow)
      const neurons = neuronsRef.current;
      const synapses = synapsesRef.current;
      const currentStep = latestStepRef.current;

      synapses.forEach((syn) => {
        const src = neurons.find((n) => n.layerIdx === syn.sourceLayer && n.neuronIdx === syn.sourceIdx);
        const tgt = neurons.find((n) => n.layerIdx === syn.targetLayer && n.neuronIdx === syn.targetIdx);
        if (!src || !tgt) return;

        const p1 = project(src.x, src.y, src.z);
        const p2 = project(tgt.x, tgt.y, tgt.z);

        const avgScale = Math.max(0.65, (p1.scale + p2.scale) / 2);
        const isLeadingToChosenAction =
          tgt.layerIdx === 3 && currentStep !== null && currentStep.action === tgt.neuronIdx;

        if (syn.isResidual) {
          // 💜 Sleek Optical Residual Conduit (Continuous Photonic Glass Fiber Arc - Seamlessly Blends with Apple Theme)
          const arcLift = 20 * avgScale;
          const midX = (p1.px + p2.px) / 2;
          const midY = (p1.py + p2.py) / 2 - arcLift;

          // Outer soft ambient glow
          ctx.strokeStyle = currentIsLight
            ? 'rgba(175, 82, 222, 0.25)'
            : 'rgba(191, 90, 242, 0.32)';
          ctx.lineWidth = 1.8 * avgScale;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.quadraticCurveTo(midX, midY, p2.px, p2.py);
          ctx.stroke();

          // Inner crisp luminous filament core
          ctx.strokeStyle = currentIsLight
            ? 'rgba(168, 85, 247, 0.65)'
            : 'rgba(216, 180, 254, 0.75)';
          ctx.lineWidth = 0.9 * avgScale;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.quadraticCurveTo(midX, midY, p2.px, p2.py);
          ctx.stroke();
        } else if (isLeadingToChosenAction) {
          // Vibrantly illuminated active decision path
          const actionColor =
            currentStep.action === 0
              ? currentIsLight ? 'rgba(36, 138, 61, 0.85)' : 'rgba(48, 209, 88, 0.75)'
              : currentStep.action === 1
              ? currentIsLight ? 'rgba(180, 120, 0, 0.85)' : 'rgba(255, 214, 10, 0.75)'
              : currentIsLight ? 'rgba(215, 0, 21, 0.85)' : 'rgba(255, 69, 58, 0.75)';

          ctx.strokeStyle = actionColor;
          ctx.lineWidth = (currentIsLight ? 1.6 : 1.35) * avgScale;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        } else {
          // Crisp synaptic fiber
          if (currentIsLight) {
            const alpha = Math.min(0.45, 0.15 + Math.abs(syn.weight) * 0.25);
            ctx.strokeStyle =
              syn.weight > 0
                ? `rgba(0, 113, 227, ${alpha})`
                : `rgba(71, 85, 105, ${alpha * 0.85})`;
            ctx.lineWidth = (0.9 + Math.abs(syn.weight) * 0.3) * avgScale;
          } else {
            const alpha = Math.min(0.55, 0.22 + Math.abs(syn.weight) * 0.28);
            ctx.strokeStyle =
              syn.weight > 0
                ? `rgba(160, 210, 255, ${alpha})`
                : `rgba(220, 225, 245, ${alpha * 0.85})`;
            ctx.lineWidth = (0.85 + Math.abs(syn.weight) * 0.25) * avgScale;
          }
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      });

      // Draw Signal Pulses (Crisp Light Photons)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        const curX = p.sourceX + (p.targetX - p.sourceX) * p.progress;
        const curY = p.sourceY + (p.targetY - p.sourceY) * p.progress;
        const curZ = p.sourceZ + (p.targetZ - p.sourceZ) * p.progress;
        const proj = project(curX, curY, curZ);

        ctx.fillStyle = p.color;
        if (!currentIsLight) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, (currentIsLight ? 2.0 : 1.8) * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Soma Orbs (Apple Polished Glass Spheres)
      neurons.forEach((n) => {
        // Decay pulse
        if (n.pulse > 0) {
          n.pulse = Math.max(0, n.pulse - 0.035);
        }

        const proj = project(n.x, n.y, n.z);
        const isOutput = n.layerIdx === 3;
        const isInput = n.layerIdx === 0;
        const isSelectedAction = isOutput && currentStep !== null && currentStep.action === n.neuronIdx;
        
        // Proportional, balanced radius
        const baseRadius = isOutput ? 7.2 : isInput ? 6.2 : 5.0;
        const radius = baseRadius * proj.scale;

        let coreColor = currentIsLight ? '#0071e3' : '#FFFFFF';
        let outerColor = currentIsLight ? 'rgba(0, 113, 227, 0.22)' : 'rgba(0, 122, 255, 0.15)';
        let auraIntensity = 1.25 + n.activation * 0.35 + n.pulse * 0.4;

        if (isOutput) {
          if (isSelectedAction) {
            if (n.neuronIdx === 0) {
              // BUY (Apple Soft Emerald)
              coreColor = currentIsLight ? '#28cd41' : '#30d158';
              outerColor = currentIsLight ? 'rgba(40, 205, 65, 0.35)' : 'rgba(48, 209, 88, 0.32)';
            } else if (n.neuronIdx === 1) {
              // HOLD (Apple Amber Yellow)
              coreColor = currentIsLight ? '#ff9f0a' : '#ffd60a';
              outerColor = currentIsLight ? 'rgba(255, 159, 10, 0.35)' : 'rgba(255, 214, 10, 0.32)';
            } else {
              // SELL (Apple Rose Crimson)
              coreColor = currentIsLight ? '#ff3b30' : '#ff453a';
              outerColor = currentIsLight ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 69, 58, 0.32)';
            }
            auraIntensity = 1.45 + n.activation * 0.4 + n.pulse * 0.5;
          } else {
            // Inactive Output Node
            coreColor = currentIsLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.42)';
            outerColor = currentIsLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
            auraIntensity = 1.15;
          }
        } else if (!isInput) {
          // Hidden Neurons
          coreColor = currentIsLight ? '#ffffff' : '#ffffff';
          outerColor = currentIsLight ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.12)';
        }

        // Soft Radial Aura
        const grad = ctx.createRadialGradient(
          proj.px,
          proj.py,
          radius * 0.1,
          proj.px,
          proj.py,
          radius * auraIntensity
        );
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.35, isSelectedAction ? outerColor : (currentIsLight ? 'rgba(0, 113, 227, 0.12)' : 'rgba(255, 255, 255, 0.12)'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * auraIntensity, 0, Math.PI * 2);
        ctx.fill();

        // Inner Polished Core
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Specular Ring
        ctx.strokeStyle = isSelectedAction
          ? coreColor
          : currentIsLight
          ? 'rgba(0, 0, 0, 0.25)'
          : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = currentIsLight ? 1.0 : 0.75;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        //  5. Apple macOS Frameless Typography
        if (isOutput || isInput) {
          ctx.save();

          const smoothScale = Math.max(0.85, Math.min(1.2, proj.scale));
          const depthAlpha = Math.max(0.4, Math.min(1.0, 1 - (proj.depth - 400) / 700));

          if (isInput) {
            // Input State Text (Left Side - Right Aligned with High Contrast)
            const textOffset = radius + 10 * smoothScale;
            const anchorX = proj.px - textOffset;
            const anchorY = proj.py;

            ctx.save();
            ctx.translate(anchorX, anchorY);
            ctx.scale(smoothScale, smoothScale);

            ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';

            ctx.fillStyle = currentIsLight
              ? `rgba(17, 24, 39, ${0.92 * depthAlpha})`
              : `rgba(220, 220, 230, ${0.85 * depthAlpha})`;
            ctx.fillText(n.label, 0, 0);

            ctx.restore();
          } else if (isOutput) {
            // Output Action Text (Right Side - Left Aligned)
            const isSelected = isSelectedAction;
            const textOffset = radius + 10 * smoothScale;
            const anchorX = proj.px + textOffset;
            const anchorY = proj.py;

            ctx.save();
            ctx.translate(anchorX, anchorY);
            ctx.scale(smoothScale, smoothScale);

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';

            if (isSelected) {
              // Active Decision
              ctx.font = '700 12.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
              ctx.fillStyle = coreColor;
              if (!currentIsLight) {
                ctx.shadowColor = coreColor;
                ctx.shadowBlur = 6;
              }
              ctx.fillText(n.label, 0, 0);
              ctx.shadowBlur = 0;
            } else {
              // Inactive Action
              ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
              ctx.fillStyle = currentIsLight
                ? `rgba(107, 114, 128, ${0.75 * depthAlpha})`
                : `rgba(142, 142, 147, ${0.45 * depthAlpha})`;
              ctx.fillText(n.label, 0, 0);
            }

            ctx.restore();
          }

          ctx.restore();
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [spawnSignals]);

  // Reliable Pointer Drag / Camera Orbit Handlers with Pointer Capture (Right Click Pan, Left Click Rotate)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // fallback
      }
    }
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (dragButtonRef.current === 2 || dragButtonRef.current === 1) {
      // 🖱️ Right-click drag or Middle-click drag: Pan the canvas (Exact same UX as Flow DAG Canvas)
      cameraRef.current.panX += dx;
      cameraRef.current.panY += dy;
    } else {
      // 🖱️ Left-click drag: Orbit / Rotate in 3D
      cameraRef.current.rotY += dx * 0.006;
      cameraRef.current.rotX = Math.max(-0.8, Math.min(0.8, cameraRef.current.rotX + dy * 0.006));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // fallback
      }
    }
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraRef.current.zoom = Math.max(0.4, Math.min(3.0, cameraRef.current.zoom - e.deltaY * 0.001));
    setZoomDisplay(Math.round(cameraRef.current.zoom * 100));
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`w-full h-full relative overflow-hidden select-none transition-colors duration-200 ${
        isLight ? 'bg-[#f5f5f7]' : 'bg-[#08080c]'
      }`}
    >
      {/*  Top Floating HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none select-none">
        <span
          className={`w-2 h-2 rounded-full ${
            isLight ? 'bg-[#28cd41] shadow-[0_0_6px_#28cd41]' : 'bg-[#30d158] shadow-[0_0_6px_#30d158]'
          } animate-pulse`}
        />
        <span className={`text-[12px] font-bold tracking-tight ${isLight ? 'text-[#111827]' : 'text-white'}`}>
          BPNN Policy Network
        </span>
        <span className={`text-[11px] font-medium ${isLight ? 'text-[#4b5563]' : 'text-[#86868b]'}`}>
          PPO Actor-Critic
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 text-[11px] font-sans pointer-events-none select-none">
        <span className={`font-semibold ${isLight ? 'text-[#111827]' : 'text-white'}`}>Architecture:</span>
        <span className={isLight ? 'text-[#4b5563]' : 'text-[#86868b]'}>
          6 In → 12 Dense → 8 Dense → 3 Action
        </span>
      </div>

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/*  Apple Maps Style Vertical Viewport Controller (Positioned at Bottom-Left, Same as Node Canvas Controls) */}
      <div
        className={`absolute bottom-4 left-4 z-20 flex flex-col items-center p-1 rounded-2xl backdrop-blur-2xl shadow-xl border select-none transition-colors ${
          isLight
            ? 'bg-white/80 border-black/10 text-[#4b5563]'
            : 'bg-[#18181f]/80 border-white/10 text-[#a1a1aa]'
        }`}
      >
        {/* Zoom In Button (+) */}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ width: 28, height: 28 }}
          className={`rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? 'hover:bg-black/5 hover:text-[#111827] active:scale-95'
              : 'hover:bg-white/10 hover:text-white active:scale-95'
          }`}
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>

        {/* Zoom Out Button (-) */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ width: 28, height: 28 }}
          className={`rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? 'hover:bg-black/5 hover:text-[#111827] active:scale-95'
              : 'hover:bg-white/10 hover:text-white active:scale-95'
          }`}
        >
          <Minus size={16} strokeWidth={2.2} />
        </button>

        {/* Reset Viewport to 75% ([ ]) */}
        <button
          onClick={handleResetView}
          title="Reset View (75%)"
          style={{ width: 28, height: 28 }}
          className={`rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? 'hover:bg-black/5 hover:text-[#111827] active:scale-95'
              : 'hover:bg-white/10 hover:text-white active:scale-95'
          }`}
        >
          <Scan size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/*  Bottom-Center Orbital Helper Hint */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-[10.5px] font-medium tracking-tight select-none whitespace-nowrap ${
          isLight ? 'text-[#6b7280]' : 'text-[#71717a]'
        }`}
        style={{ fontFamily: 'var(--font-apple-text)' }}
      >
        Left-drag: Orbit · Right-drag: Pan · Scroll: Zoom
      </div>
    </div>
  );
};

export default LiveNeuralLink;
