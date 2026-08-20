import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Layers } from 'lucide-react';
import type { QuantFeatures } from '../types/ppo';

interface Neural3DLinkProps {
  quantVector: QuantFeatures;
  actionProbs: { hold: number; buy: number; sell: number };
  isTraining: boolean;
}

export const Neural3DLink: React.FC<Neural3DLinkProps> = ({
  quantVector,
  actionProbs,
  isTraining,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef({ x: 0.08, y: -0.14, zoom: 1.05 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Mode: '3d-05' (Braided Synaptic Stream) vs '3d-01' (Classic Node Mesh)
  const [visualMode, setVisualMode] = useState<'3d-05' | '3d-01'>('3d-05');
  const visualModeRef = useRef(visualMode);

  useEffect(() => {
    visualModeRef.current = visualMode;
  }, [visualMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let timeTick = 0;

    // Strands for 3D-05 Braided Wave Flux
    const inputLabels = ['Ret1', 'Ret5', 'RSI', 'DistSMA', 'Pos', 'PnL'];
    const totalStrands = 20;
    const strands = Array.from({ length: totalStrands }).map((_, i) => {
      const normIdx = i / (totalStrands - 1);
      const spreadY = (normIdx - 0.5) * 260;
      const spreadZ = Math.sin(normIdx * Math.PI) * 70 - 35;
      const palette = ['#00f0ff', '#00c7be', '#38bdf8', '#007aff', '#60a5fa', '#818cf8'];

      return {
        id: i,
        startY: spreadY,
        startZ: spreadZ,
        label: inputLabels[i % inputLabels.length],
        freq1: 1.8 + (i % 5) * 0.4,
        freq2: 3.0 + (i % 3) * 0.6,
        amp1: 42 + Math.sin(i * 1.3) * 22,
        amp2: 28 + Math.cos(i * 1.7) * 16,
        phase1: (i * Math.PI * 2) / 6,
        phase2: (i * Math.PI * 2) / 4.2,
        colorHex: palette[i % palette.length],
        glowHex: 'rgba(0, 240, 255, 0.45)',
      };
    });

    const particles: {
      strandIdx: number;
      progress: number;
      speed: number;
    }[] = [];

    // Nodes for 3D-01 Classic Mesh
    const nodes = [
      // 6 Core Inputs
      ...Array.from({ length: 6 }).map((_, i) => ({
        layer: 0,
        idx: i,
        x: -260,
        y: 110 - i * 44,
        z: Math.sin((i / 6) * Math.PI) * 20,
        label: ['Ret1', 'Ret5', 'RSI', 'DistSMA', 'Position', 'PnL'][i],
        color: '#00c7be',
      })),
      // 8 Hidden 1
      ...Array.from({ length: 8 }).map((_, i) => ({
        layer: 1,
        idx: i,
        x: -90,
        y: 140 - i * 40,
        z: Math.sin((i / 8) * Math.PI) * 25,
        label: `H1_${i + 1}`,
        color: '#007aff',
      })),
      // 8 Hidden 2
      ...Array.from({ length: 8 }).map((_, i) => ({
        layer: 2,
        idx: i,
        x: 90,
        y: 140 - i * 40,
        z: Math.sin((i / 8) * Math.PI) * 25,
        label: `H2_${i + 1}`,
        color: '#007aff',
      })),
      // 3 Outputs
      { layer: 3, idx: 0, x: 260, y: 65, z: 0, label: 'HOLD', color: '#86868b' },
      { layer: 3, idx: 1, x: 260, y: 0, z: 0, label: 'BUY', color: '#30d158' },
      { layer: 3, idx: 2, x: 260, y: -65, z: 0, label: 'SELL', color: '#ff453a' },
    ];

    const project = (x: number, y: number, z: number) => {
      const radX = rotRef.current.x;
      const radY = rotRef.current.y;
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX + 520;

      const fov = 750;
      const scale = (fov / Math.max(10, z2)) * rotRef.current.zoom;
      return {
        px: canvas.width / 2 + x1 * scale,
        py: canvas.height / 2 + y1 * scale,
        scale,
        depth: z2,
      };
    };

    const render = () => {
      timeTick += 0.025;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Midnight Radial Backdrop
      const bgGrad = ctx.createRadialGradient(
        canvas.width * 0.45,
        canvas.height * 0.5,
        40,
        canvas.width * 0.5,
        canvas.height * 0.5,
        Math.max(canvas.width, canvas.height) * 0.75
      );
      bgGrad.addColorStop(0, '#040b18');
      bgGrad.addColorStop(0.5, '#02050e');
      bgGrad.addColorStop(1, '#000104');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mode = visualModeRef.current;

      if (mode === '3d-05') {
        // =====================================================================
        // 🌟 3D-05 BRAIDED SYNAPTIC WAVE FLUX
        // =====================================================================

        // Action Decision Beam Color
        let beamColor = '#00c7be';
        let beamGlow = 'rgba(0, 199, 190, 0.45)';
        if (actionProbs.buy > actionProbs.sell && actionProbs.buy > actionProbs.hold) {
          beamColor = '#30d158'; // BUY
          beamGlow = 'rgba(48, 209, 88, 0.55)';
        } else if (actionProbs.sell > actionProbs.buy && actionProbs.sell > actionProbs.hold) {
          beamColor = '#ff453a'; // SELL
          beamGlow = 'rgba(255, 69, 58, 0.55)';
        }

        // Spawn Photon Signal Particles
        if (isTraining && Math.random() < 0.6) {
          particles.push({
            strandIdx: Math.floor(Math.random() * strands.length),
            progress: 0,
            speed: 0.016 + Math.random() * 0.014,
          });
        }

        // Render Wave Strands
        strands.forEach((strand) => {
          const numSegments = 45;
          const points: { px: number; py: number; scale: number; depth: number }[] = [];

          for (let seg = 0; seg <= numSegments; seg++) {
            const t = seg / numSegments;
            const x = -300 + t * 540; // -300 -> +240
            const envelope = Math.pow(1.0 - t, 0.85);
            const midBulge = Math.sin(t * Math.PI) * 1.35;

            const waveY =
              Math.sin(t * Math.PI * strand.freq1 + strand.phase1 + timeTick) * strand.amp1 * midBulge +
              Math.cos(t * Math.PI * strand.freq2 + strand.phase2 + timeTick * 0.8) * strand.amp2 * midBulge;

            const y = strand.startY * envelope + waveY * envelope;
            const z = strand.startZ * envelope + Math.sin(t * Math.PI * 2 + strand.phase1) * 35 * midBulge;

            points.push(project(x, y, z));
          }

          if (points.length < 2) return;
          const avgScale = points[Math.floor(points.length / 2)].scale;

          // Ambient Glow
          ctx.strokeStyle = strand.glowHex;
          ctx.lineWidth = 3.5 * avgScale;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(points[0].px, points[0].py);
          for (let p = 1; p < points.length; p++) ctx.lineTo(points[p].px, points[p].py);
          ctx.stroke();

          // Core Fiber
          ctx.strokeStyle = strand.colorHex;
          ctx.lineWidth = 1.6 * avgScale;
          ctx.beginPath();
          ctx.moveTo(points[0].px, points[0].py);
          for (let p = 1; p < points.length; p++) ctx.lineTo(points[p].px, points[p].py);
          ctx.stroke();

          // Origin Glowing Node Dot
          const startPt = points[0];
          ctx.fillStyle = strand.colorHex;
          ctx.shadowColor = strand.colorHex;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(startPt.px, startPt.py, 3.2 * startPt.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Input Label Text
          ctx.font = '600 10.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
          ctx.fillStyle = 'rgba(220, 245, 255, 0.85)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(strand.label, startPt.px - 9 * startPt.scale, startPt.py);
        });

        // Converged Laser Decision Beam
        const beamStart = project(240, 0, 0);
        const beamEnd = project(440, 0, 0);

        ctx.strokeStyle = beamGlow;
        ctx.lineWidth = 6.0 * beamStart.scale;
        ctx.beginPath();
        ctx.moveTo(beamStart.px, beamStart.py);
        ctx.lineTo(beamEnd.px, beamEnd.py);
        ctx.stroke();

        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 2.4 * beamStart.scale;
        ctx.beginPath();
        ctx.moveTo(beamStart.px, beamStart.py);
        ctx.lineTo(beamEnd.px, beamEnd.py);
        ctx.stroke();

        // Decision Action Label at beam tip
        const actionStr =
          actionProbs.buy > actionProbs.sell && actionProbs.buy > actionProbs.hold
            ? '▲ BUY CONVICTION'
            : actionProbs.sell > actionProbs.buy && actionProbs.sell > actionProbs.hold
            ? '▼ SELL CONVICTION'
            : '● OPTIMAL HOLD';

        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
        ctx.fillStyle = beamColor;
        ctx.shadowColor = beamColor;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(actionStr, beamEnd.px + 12 * beamEnd.scale, beamEnd.py);
        ctx.shadowBlur = 0;

        // Render Photons
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.progress += p.speed;
          if (p.progress >= 1.0) {
            particles.splice(i, 1);
            continue;
          }

          const strand = strands[p.strandIdx] || strands[0];
          const t = p.progress;
          const x = -300 + t * 540;
          const envelope = Math.pow(1.0 - t, 0.85);
          const midBulge = Math.sin(t * Math.PI) * 1.35;
          const waveY =
            Math.sin(t * Math.PI * strand.freq1 + strand.phase1 + timeTick) * strand.amp1 * midBulge +
            Math.cos(t * Math.PI * strand.freq2 + strand.phase2 + timeTick * 0.8) * strand.amp2 * midBulge;

          const y = strand.startY * envelope + waveY * envelope;
          const z = strand.startZ * envelope + Math.sin(t * Math.PI * 2 + strand.phase1) * 35 * midBulge;
          const proj = project(x, y, z);

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = strand.colorHex;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, 2.6 * proj.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        // =====================================================================
        // 3D-01 CLASSIC DENSE NODE MESH
        // =====================================================================
        for (let l = 0; l < 3; l++) {
          const srcNodes = nodes.filter((n) => n.layer === l);
          const dstNodes = nodes.filter((n) => n.layer === l + 1);

          srcNodes.forEach((s) => {
            const p1 = project(s.x, s.y, s.z);
            dstNodes.forEach((d) => {
              const p2 = project(d.x, d.y, d.z);
              ctx.strokeStyle = 'rgba(0, 122, 255, 0.25)';
              ctx.lineWidth = 0.8 * p1.scale;
              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.stroke();
            });
          });
        }

        nodes.forEach((n) => {
          const p = project(n.x, n.y, n.z);
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 4.5 * p.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, p.px, p.py - 8 * p.scale);
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isTraining, actionProbs]);

  return (
    <div className="bg-[#000104] border border-[#1c1c24] rounded-2xl p-4 flex flex-col h-full relative overflow-hidden select-none">
      {/* Top Floating HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          3D-05 Synaptic Wave Flux
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#00c7be]">
          Braided Stream
        </span>
      </div>

      {/* Mode Switcher Pills */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0c14]/80 backdrop-blur-xl border border-white/10 text-xs">
        <button
          onClick={() => setVisualMode('3d-05')}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            visualMode === '3d-05'
              ? 'bg-gradient-to-r from-[#00c7be] to-[#007aff] text-white shadow-lg shadow-cyan-950/50'
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3D-05 Stream</span>
        </button>
        <button
          onClick={() => setVisualMode('3d-01')}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
            visualMode === '3d-01'
              ? 'bg-[#007aff] text-white'
              : 'text-[#86868b] hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D-01 Grid</span>
        </button>
      </div>

      {/* Interactive 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={900}
        height={500}
        className="flex-1 w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing block"
        onMouseDown={(e) => {
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!isDraggingRef.current) return;
          const dx = e.clientX - lastMouseRef.current.x;
          const dy = e.clientY - lastMouseRef.current.y;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };

          rotRef.current.y += dx * 0.006;
          rotRef.current.x = Math.max(-0.8, Math.min(0.8, rotRef.current.x + dy * 0.006));
        }}
        onMouseUp={() => (isDraggingRef.current = false)}
        onMouseLeave={() => (isDraggingRef.current = false)}
        onWheel={(e) => {
          rotRef.current.zoom = Math.max(0.4, Math.min(2.5, rotRef.current.zoom - e.deltaY * 0.001));
        }}
      />

      {/* Action Probability Badges at Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 text-xs font-mono font-bold">
        <span className="px-2.5 py-1 rounded-lg bg-[#121217] border border-[#1c1c24] text-[#86868b]">
          HOLD: {actionProbs.hold.toFixed(1)}%
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#30d158]/10 border border-[#30d158]/30 text-[#30d158]">
          BUY: {actionProbs.buy.toFixed(1)}%
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/30 text-[#ff453a]">
          SELL: {actionProbs.sell.toFixed(1)}%
        </span>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[10.5px] font-mono text-[#86868b] select-none">
        Left-drag: Orbit 3D · Scroll: Zoom
      </div>
    </div>
  );
};
