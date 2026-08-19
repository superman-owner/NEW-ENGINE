import React, { useRef, useEffect } from 'react';
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
  const rotRef = useRef({ x: 0.12, y: -0.25, zoom: 1.15 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const nodes = [
      // 12 Inputs
      ...Array.from({ length: 12 }).map((_, i) => ({
        layer: 0,
        idx: i,
        x: -260,
        y: 165 - i * 30,
        z: Math.sin((i / 12) * Math.PI) * 20,
        label: ['Ret1', 'Ret3', 'Ret8', 'Ret21', 'RSI', 'VolATR', 'EMA50', 'BB%B', 'SinT', 'CosT', 'Pos', 'PnL'][i],
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

    const particles: Array<{ src: any; tgt: any; prog: number; speed: number; color: string }> = [];

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      if (!isDraggingRef.current) {
        rotRef.current.y += 0.0015;
      }

      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);

      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX + 500;
        const scale = (700.0 / Math.max(10, z2)) * rotRef.current.zoom;
        const px = w / 2 + x1 * scale;
        const py = h / 2 - y1 * scale;
        return { px, py, scale };
      };

      // Draw Synapses
      ctx.lineWidth = 1.0;
      for (let l = 0; l < 3; l++) {
        const srcList = nodes.filter((n) => n.layer === l);
        const tgtList = nodes.filter((n) => n.layer === l + 1);

        srcList.forEach((src) => {
          tgtList.forEach((tgt) => {
            const p1 = project(src.x, src.y, src.z);
            const p2 = project(tgt.x, tgt.y, tgt.z);
            ctx.strokeStyle = l === 0 ? 'rgba(0, 199, 190, 0.12)' : (l === 1 ? 'rgba(0, 122, 255, 0.12)' : 'rgba(255, 255, 255, 0.15)');
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          });
        });
      }

      // Spawn signal particles
      if (isTraining && Math.random() < 0.4) {
        const l = Math.floor(Math.random() * 3);
        const srcList = nodes.filter((n) => n.layer === l);
        const tgtList = nodes.filter((n) => n.layer === l + 1);
        if (srcList.length && tgtList.length) {
          const src = srcList[Math.floor(Math.random() * srcList.length)];
          const tgt = tgtList[Math.floor(Math.random() * tgtList.length)];
          particles.push({
            src,
            tgt,
            prog: 0,
            speed: 0.02 + Math.random() * 0.02,
            color: l === 2 ? '#30d158' : '#00c7be',
          });
        }
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.prog += p.speed;
        if (p.prog >= 1.0) {
          particles.splice(i, 1);
          continue;
        }
        const curX = p.src.x + (p.tgt.x - p.src.x) * p.prog;
        const curY = p.src.y + (p.tgt.y - p.src.y) * p.prog;
        const curZ = p.src.z + (p.tgt.z - p.src.z) * p.prog;
        const proj = project(curX, curY, curZ);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, 2.5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Nodes
      nodes.forEach((n) => {
        const { px, py, scale } = project(n.x, n.y, n.z);
        const r = (n.layer === 0 || n.layer === 3 ? 6.5 : 5.0) * scale;

        // Halo
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px, py, r * 1.6, 0, Math.PI * 2);
        ctx.stroke();

        // Core
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (n.layer === 0 || n.layer === 3) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.floor(9 * scale)}px JetBrains Mono`;
          ctx.textAlign = n.layer === 0 ? 'right' : 'left';
          ctx.fillText(n.label, px + (n.layer === 0 ? -12 * scale : 12 * scale), py + 3);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isTraining]);

  return (
    <div className="bg-[#0c0c10] border border-[#1c1c24] rounded-2xl p-4 flex flex-col h-full relative overflow-hidden select-none">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#007aff]" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          3D Neural Link (12-Feature PPO Actor-Critic)
        </h3>
      </div>

      {/* Policy Action Pills Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-xs font-mono font-bold">
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

      {/* Interactive 3D Canvas */}
      <div
        className="flex-1 w-full min-h-[300px] cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!isDraggingRef.current) return;
          const dx = e.clientX - lastMouseRef.current.x;
          const dy = e.clientY - lastMouseRef.current.y;
          rotRef.current.y += dx * 0.006;
          rotRef.current.x += dy * 0.006;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseUp={() => (isDraggingRef.current = false)}
        onMouseLeave={() => (isDraggingRef.current = false)}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};
