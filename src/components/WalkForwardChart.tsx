import React, { useRef, useEffect } from 'react';

interface WalkForwardChartProps {
  trainHistory: number[];
  valHistory: number[];
  maHistory: number[];
  latestReward: number;
  latestValReward: number;
}

export const WalkForwardChart: React.FC<WalkForwardChartProps> = ({
  trainHistory,
  valHistory,
  maHistory,
  latestReward,
  latestValReward,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Subtle Grid Lines
    ctx.strokeStyle = '#1c1c24';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    if (trainHistory.length < 2) {
      ctx.fillStyle = '#86868b';
      ctx.font = '12px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Standby - Start PPO Training to stream Live Walk-Forward Curves', w / 2, h / 2);
      return;
    }

    // Determine scale bounds
    const allVals = [...trainHistory, ...valHistory];
    const minVal = Math.min(...allVals, -5);
    const maxVal = Math.max(...allVals, 5);
    const range = maxVal - minVal || 1;

    const padLeft = 40;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const getX = (idx: number) => padLeft + (idx / (trainHistory.length - 1)) * plotW;
    const getY = (val: number) => padTop + plotH - ((val - minVal) / range) * plotH;

    // 1. Draw In-Sample Area Gradient
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, 'rgba(48, 209, 88, 0.22)');
    grad.addColorStop(1, 'rgba(48, 209, 88, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(minVal));
    trainHistory.forEach((v, i) => {
      ctx.lineTo(getX(i), getY(v));
    });
    ctx.lineTo(getX(trainHistory.length - 1), getY(minVal));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 2. Draw 10-Ep Moving Average Line
    if (maHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#86868b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      maHistory.forEach((v, i) => {
        if (i === 0) ctx.moveTo(getX(i), getY(v));
        else ctx.lineTo(getX(i), getY(v));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Out-of-Sample Test Line (Neon Cyan)
    if (valHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#00c7be';
      ctx.lineWidth = 2.2;
      valHistory.forEach((v, i) => {
        if (i === 0) ctx.moveTo(getX(i), getY(v));
        else ctx.lineTo(getX(i), getY(v));
      });
      ctx.stroke();
    }

    // 4. Draw In-Sample Train Line (Apple Green)
    ctx.beginPath();
    ctx.strokeStyle = '#30d158';
    ctx.lineWidth = 2.6;
    ctx.shadowColor = '#30d158';
    ctx.shadowBlur = 10;
    trainHistory.forEach((v, i) => {
      if (i === 0) ctx.moveTo(getX(i), getY(v));
      else ctx.lineTo(getX(i), getY(v));
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw End Point Pulse
    const lastX = getX(trainHistory.length - 1);
    const lastY = getY(trainHistory[trainHistory.length - 1]);
    ctx.fillStyle = '#30d158';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [trainHistory, valHistory, maHistory]);

  return (
    <div className="bg-[#0c0c10] border border-[#1c1c24] rounded-2xl p-4 flex flex-col h-full">
      {/* Header & Legend */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#30d158]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            RL Reward Curve & Walk-Forward Telemetry
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#30d158] rounded-full" />
            <span className="text-white">Train Set ({latestReward >= 0 ? '+' : ''}{latestReward.toFixed(2)} R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#00c7be] rounded-full" />
            <span className="text-[#00c7be]">Test Val ({latestValReward >= 0 ? '+' : ''}{latestValReward.toFixed(2)} R)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#86868b]">
            <span className="w-3 h-0.5 bg-[#86868b] border-b border-dashed" />
            <span>10-Ep MA</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 w-full min-h-[280px]">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};
