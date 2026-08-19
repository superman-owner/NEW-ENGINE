import React, { useRef, useEffect, useCallback } from 'react';
import type {
  Brain3DNode,
  Brain3DEdge,
  GNNMessageParticle,
  GNNControlState,
} from './types';

interface NeuralCanvasProps {
  nodes: Brain3DNode[];
  edges: Brain3DEdge[];
  particles: GNNMessageParticle[];
  gnnState: GNNControlState;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onInjectCurrent: (nodeId: string, currentAmount: number) => void;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({
  nodes,
  edges,
  particles,
  gnnState,
  selectedNodeId,
  onSelectNode,
  onInjectCurrent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Camera & Orbital Rotation State
  const cameraRef = useRef({
    rotX: 0.25, // Pitch (tilt)
    rotY: -0.45, // Yaw (turn)
    zoom: 1.45,
    panX: 0,
    panY: 0,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hoveredNodeIdRef = useRef<string | null>(null);

  // Synced refs for high-frequency 60 FPS animation loop
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const particlesRef = useRef(particles);
  particlesRef.current = particles;
  const gnnStateRef = useRef(gnnState);
  gnnStateRef.current = gnnState;
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

  // 3D Matrix Rotation & Perspective Projection
  const project3D = useCallback(
    (
      x: number,
      y: number,
      z: number,
      canvasWidth: number,
      canvasHeight: number,
      rotX: number,
      rotY: number,
      zoom: number,
      panX: number,
      panY: number
    ) => {
      // 1. Rotation around Y axis (Yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY + z * sinY;
      const y1 = y;
      const z1 = -x * sinY + z * cosY;

      // 2. Rotation around X axis (Pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // 3. Perspective Camera Projection
      const focalLength = 550;
      const cameraDistance = 380;
      const depth = z2 + cameraDistance;
      const safeDepth = Math.max(10, depth);
      const scale = (focalLength / safeDepth) * zoom;

      const screenX = canvasWidth / 2 + panX + x2 * scale;
      const screenY = canvasHeight / 2 + panY - y2 * scale; // Invert Y so up is positive

      return {
        screenX,
        screenY,
        scale,
        depth: z2, // For Z-sorting (larger z2 = closer to camera)
      };
    },
    []
  );

  // Main 60 FPS 3D Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const state = gnnStateRef.current;

      // Auto-rotation around Y axis if enabled and not currently dragging
      if (state.autoRotate && !isDraggingRef.current) {
        cameraRef.current.rotY += 0.004 * state.rotationSpeed;
      }

      const { rotX, rotY, zoom, panX, panY } = cameraRef.current;

      // 1. Clear with Deep Black Abyss
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Bio-Quantum Center Glow
      const centerGlow = ctx.createRadialGradient(
        width / 2 + panX,
        height / 2 + panY,
        50 * zoom,
        width / 2 + panX,
        height / 2 + panY,
        width * 0.65
      );
      centerGlow.addColorStop(0, 'rgba(15, 30, 60, 0.45)');
      centerGlow.addColorStop(0.4, 'rgba(10, 8, 28, 0.25)');
      centerGlow.addColorStop(1, 'rgba(3, 3, 8, 1)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const currentParticles = particlesRef.current;

      const nodeMap = new Map<string, Brain3DNode>();
      currentNodes.forEach((n) => nodeMap.set(n.id, n));

      const hoveredId = hoveredNodeIdRef.current;
      const selectedId = selectedNodeIdRef.current;

      // 3. Project all 3D nodes into 2D screen space
      const projectedNodes: Array<{
        node: Brain3DNode;
        screenX: number;
        screenY: number;
        scale: number;
        depth: number;
      }> = [];

      const projectedMap = new Map<
        string,
        { screenX: number; screenY: number; scale: number; depth: number }
      >();

      currentNodes.forEach((node) => {
        // Lobe active filter check
        if (state.activeLobes && !state.activeLobes[node.lobe]) return;

        const proj = project3D(
          node.x,
          node.y,
          node.z,
          width,
          height,
          rotX,
          rotY,
          zoom,
          panX,
          panY
        );
        projectedNodes.push({ node, ...proj });
        projectedMap.set(node.id, proj);
      });

      // 4. Sort Nodes and Edges by Depth (Back-to-Front Z-Sorting)
      projectedNodes.sort((a, b) => a.depth - b.depth);

      // 5. Render 3D Synaptic Wireframe Edges
      if (state.showWireframe) {
        ctx.save();
        currentEdges.forEach((edge) => {
          const p1 = projectedMap.get(edge.sourceId);
          const p2 = projectedMap.get(edge.targetId);
          if (!p1 || !p2) return;

          const isHighlighted =
            edge.sourceId === hoveredId ||
            edge.targetId === hoveredId ||
            edge.sourceId === selectedId ||
            edge.targetId === selectedId;

          const avgDepth = (p1.depth + p2.depth) / 2;
          // Depth fading factor (0.1 in back to 0.7 in front)
          const depthAlpha = Math.max(0.06, Math.min(0.85, (avgDepth + 180) / 360));

          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);

          if (isHighlighted) {
            ctx.strokeStyle = '#64d2ff';
            ctx.lineWidth = 2.2 * p1.scale;
            ctx.shadowColor = '#007aff';
            ctx.shadowBlur = 10;
          } else {
            ctx.strokeStyle = `rgba(40, 180, 240, ${depthAlpha * 0.45})`;
            ctx.lineWidth = Math.max(0.6, 1.1 * p1.scale * edge.weight);
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        });
        ctx.restore();
      }

      // 6. Render GNN Message Passing Traveling Light Packets
      currentParticles.forEach((particle) => {
        const p1 = projectedMap.get(particle.sourceId);
        const p2 = projectedMap.get(particle.targetId);
        if (!p1 || !p2) return;

        const t = particle.progress;
        const curX = p1.screenX + (p2.screenX - p1.screenX) * t;
        const curY = p1.screenY + (p2.screenY - p1.screenY) * t;
        const curScale = (p1.scale + (p2.scale - p1.scale) * t) * 1.5;

        // Glowing particle head
        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, Math.max(2, 3.5 * curScale), 0, Math.PI * 2);
        ctx.fillStyle = particle.color || '#ffd60a';
        ctx.shadowColor = particle.color || '#ffd60a';
        ctx.shadowBlur = 12;
        ctx.fill();

        // White core
        ctx.beginPath();
        ctx.arc(curX, curY, Math.max(1, 1.5 * curScale), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // 7. Render 3D Somas / Constellation Vertices
      projectedNodes.forEach(({ node, screenX, screenY, scale, depth }) => {
        const isHovered = node.id === hoveredId;
        const isSelected = node.id === selectedId;
        const isSpiking = node.isSpiking;

        // Depth cueing opacity and size
        const depthFactor = Math.max(0.2, Math.min(1.0, (depth + 180) / 360));
        const renderedRadius = Math.max(
          1.8,
          node.size * scale * (isSpiking ? 2.2 : isHovered || isSelected ? 1.8 : 1.0)
        );

        ctx.save();

        // Outer Luminescent Halo (BBC news glow style)
        if (isSpiking || isHovered || isSelected || depthFactor > 0.45) {
          const haloRadius = renderedRadius * (isSpiking ? 3.5 : isSelected ? 3.0 : 2.2);
          const haloGrad = ctx.createRadialGradient(
            screenX,
            screenY,
            renderedRadius * 0.2,
            screenX,
            screenY,
            haloRadius
          );
          haloGrad.addColorStop(
            0,
            isSpiking ? 'rgba(255, 69, 58, 0.8)' : node.accentColor
          );
          haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(screenX, screenY, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = haloGrad;
          ctx.globalAlpha = depthFactor;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Inner Solid Body
        ctx.beginPath();
        ctx.arc(screenX, screenY, renderedRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSpiking ? '#ff3b30' : isSelected ? '#ffffff' : node.color;
        ctx.shadowColor = isSpiking ? '#ff3b30' : node.color;
        ctx.shadowBlur = isSpiking ? 18 : isHovered ? 14 : 6 * depthFactor;
        ctx.fill();

        // White core highlight
        if (depthFactor > 0.4 || isSpiking || isSelected) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, renderedRadius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, renderedRadius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#64d2ff';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [project3D]);

  // Handle Resize with DPR
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3D Orbital Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Orbit Rotation
      cameraRef.current.rotY += dx * 0.007;
      cameraRef.current.rotX = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, cameraRef.current.rotX - dy * 0.007)
      );

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }

    // Raycast / Proximity check for node hover
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    let closestNodeId: string | null = null;
    let closestDist = 22; // Hover proximity radius in screen px

    const { rotX, rotY, zoom, panX, panY } = cameraRef.current;

    nodesRef.current.forEach((node) => {
      const proj = project3D(
        node.x,
        node.y,
        node.z,
        canvas.width,
        canvas.height,
        rotX,
        rotY,
        zoom,
        panX,
        panY
      );
      const dist = Math.hypot(proj.screenX - mouseX, proj.screenY - mouseY);
      if (dist < closestDist) {
        closestDist = dist;
        closestNodeId = node.id;
      }
    });

    hoveredNodeIdRef.current = closestNodeId;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    let clickedNodeId: string | null = null;
    let closestDist = 24;

    const { rotX, rotY, zoom, panX, panY } = cameraRef.current;

    nodesRef.current.forEach((node) => {
      const proj = project3D(
        node.x,
        node.y,
        node.z,
        canvas.width,
        canvas.height,
        rotX,
        rotY,
        zoom,
        panX,
        panY
      );
      const dist = Math.hypot(proj.screenX - mouseX, proj.screenY - mouseY);
      if (dist < closestDist) {
        closestDist = dist;
        clickedNodeId = node.id;
      }
    });

    if (clickedNodeId) {
      onSelectNode(clickedNodeId);
      onInjectCurrent(clickedNodeId, 45); // Trigger high-intensity spike
    } else {
      onSelectNode(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    cameraRef.current.zoom = Math.min(3.5, Math.max(0.5, cameraRef.current.zoom * zoomFactor));
  };

  const handleResetCamera = () => {
    cameraRef.current = {
      rotX: 0.25,
      rotY: -0.45,
      zoom: 1.45,
      panX: 0,
      panY: 0,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#030308] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating 3D Navigation Controls Overlay (Top-Left) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5 bg-[#0a0a14]/90 backdrop-blur-xl border border-white/[0.1] px-3.5 py-1.5 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.9)] text-xs text-white">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ffd60a] animate-ping" />
          <span className="font-mono text-[11px] font-bold text-white tracking-wider">
            3D CONNECTOME GNN
          </span>
        </span>
        <div className="h-3.5 w-[1px] bg-white/10 mx-1" />
        <span className="text-[11px] text-white/50">🖱️ Drag to Orbit 360° • Scroll to Zoom</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResetCamera();
          }}
          className="ml-2 text-[10px] font-mono font-semibold text-[#007aff] hover:text-[#38bdf8] bg-[#007aff]/10 px-2 py-0.5 rounded-lg border border-[#007aff]/25 cursor-pointer"
        >
          Reset Camera
        </button>
      </div>
    </div>
  );
};
