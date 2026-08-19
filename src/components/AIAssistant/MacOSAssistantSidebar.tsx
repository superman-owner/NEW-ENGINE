import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFlow } from '../../context/FlowContext';
import { RobotAvatar } from './RobotAvatar';
import {
  callAIModel,
  getAISettings,
  testAIConnection,
  sanitizeFemaleThaiParticles,
} from '../../services/aiApiService';
import type { CopilotAction } from '../../services/aiApiService';
import {
  saveCurrentProject,
  createNewBlankProject,
  deleteAllSavedProjects,
  deleteProject,
  getSavedProjects,
} from '../../services/projectService';
import { NODE_DEFS } from '../../data/nodeRegistry';
import { INITIAL_NODES, INITIAL_EDGES, autoTunePipelineNodes } from '../Flow/FlowCanvasView';

const GROUP_COLUMNS: Record<string, number> = {
  input: 50,
  fc1: 410,
  regularization: 770,
  fc2: 1130,
  reward: 1490,
  output: 1850,
};

const createNodeInstance = (
  nodeType: string,
  customData: Record<string, any> = {},
  customPos?: { x: number; y: number },
  existingNodes: any[] = []
): any => {
  const def = NODE_DEFS[nodeType];
  const group = def?.group || 'input';
  const colX = GROUP_COLUMNS[group] ?? 50;

  const nodesInCol = existingNodes.filter(
    (n) => (n.position?.x ?? 0) >= colX - 40 && (n.position?.x ?? 0) <= colX + 40
  );
  const defaultY = 120 + nodesInCol.length * 160;

  const defaultFields: Record<string, any> = {};
  if (def?.fields) {
    def.fields.forEach((f) => {
      defaultFields[f.key] = f.default;
    });
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const label = def?.label || nodeType;

  return {
    id: `node-${Date.now()}-${randomSuffix}`,
    type: 'nodeCard',
    position: customPos || { x: colX, y: defaultY },
    data: {
      nodeType,
      label,
      ...defaultFields,
      ...customData,
      execution: { status: 'passed', detail: `${label} Configured` },
    },
  };
};

const autoLayoutAllNodes = (nodesToLayout: any[]): any[] => {
  const colCounts: Record<string, number> = {
    input: 0,
    fc1: 0,
    regularization: 0,
    fc2: 0,
    reward: 0,
    output: 0,
  };

  return nodesToLayout.map((node) => {
    const nodeType = String(node.data?.nodeType || node.type || '');
    const def = NODE_DEFS[nodeType];
    const group = def?.group || 'input';
    const colX = GROUP_COLUMNS[group] ?? 50;
    const indexInCol = colCounts[group] || 0;
    colCounts[group] = indexInCol + 1;

    const y = 120 + indexInCol * 160;
    return {
      ...node,
      position: { x: colX, y },
    };
  });
};

const resolveNodeTypeFromQuery = (text: string): string | null => {
  const lower = text.toLowerCase();
  if (lower.includes('news') || lower.includes('ข่าว')) return 'news_impact_filter';
  if (lower.includes('volatility') || lower.includes('ผันผวน') || lower.includes('atr')) return 'volatility_indicator';
  if (lower.includes('position feedback') || lower.includes('โพสิชั่น')) return 'position_feedback';
  if (lower.includes('episode') || lower.includes('เป้าหมาย') || lower.includes('รอบเทรน')) return 'training_episodes_config';
  if (lower.includes('mtf') || lower.includes('multi-timeframe') || lower.includes('timeframe fusion') || lower.includes('higher tf')) return 'multi_timeframe_fusion';
  if (lower.includes('session') || lower.includes('วันเวลา') || lower.includes('london') || lower.includes('new york')) return 'session_time_filter';
  if (lower.includes('dense') || lower.includes('fc1') || lower.includes('expansion') || lower.includes('ขยาย')) return 'fc1_dense_expansion';
  if (lower.includes('attention') || lower.includes('saliency') || lower.includes('ความสนใจ')) return 'fc1_attention_weights';
  if (lower.includes('dropout') || lower.includes('ดรอปเอาท์')) return 'spatial_dropout_regularization';
  if (lower.includes('layer norm') || lower.includes('normalization') || lower.includes('นอร์ม')) return 'layer_normalization';
  if (lower.includes('gradient clip') || lower.includes('คลิป')) return 'gradient_clipping';
  if (lower.includes('bottleneck') || lower.includes('fc2') || lower.includes('synthesizer') || lower.includes('สังเคราะห์')) return 'fc2_bottleneck_synthesizer';
  if (lower.includes('friction') || lower.includes('spread') || lower.includes('สเปรด')) return 'friction_spread_cost';
  if (lower.includes('inactivity') || lower.includes('idle') || lower.includes('ต้นทุนค่าเสียโอกาส')) return 'anti_inactivity_reward';
  if (lower.includes('drawdown') || lower.includes('dd guard') || lower.includes('ขาดทุนสะสม')) return 'drawdown_guard_penalty';
  if (lower.includes('policy') || lower.includes('action head') || lower.includes('fc3') || lower.includes('หัวนโยบาย')) return 'fc3_policy_action_head';
  if (lower.includes('lot') || lower.includes('sizer') || lower.includes('ขนาดสัญญา') || lower.includes('position sizer')) return 'dynamic_lot_sizer';
  if (lower.includes('trailing') || lower.includes('breakeven') || lower.includes('เทรลลิ่ง') || lower.includes('สต็อป')) return 'trailing_stop_breakeven';
  if (lower.includes('telegram') || lower.includes('webhook') || lower.includes('แจ้งเตือน') || lower.includes('discord')) return 'telegram_webhook_alert';
  if (lower.includes('onnx') || lower.includes('compiler') || lower.includes('คอมไพเลอร์')) return 'onnx_mt5_compiler';
  if (lower.includes('strategy') || lower.includes('preset') || lower.includes('หน้าต่างผลตอบแทน')) return 'strategy_preset_return';
  return null;
};

// 🎯 Smart Quant & Trading Phonetic / Vocabulary Normalizer (Fixes SpeechRecognition homophone mistakes)
const normalizeQuantVoiceInput = (raw: string): string => {
  let text = raw;

  const dictionary: [RegExp, string][] = [
    [/โน้ต|โหนด|โนต|โหนต/gi, 'Node'],
    [/เอพพิโซด|เอพพิโสด|เอพพิโซท|เอพพิโซต|เอพิโสด|เอพิโซด|อิพิโสด|อิพิโซด/gi, 'Episode'],
    [/ชาว\s*usd|ชาว\s*ยูเอสดี|ทองคำ|ทอง\s*คำ/gi, 'XAUUSD'],
    [/ยูโร\s*usd|ยูโร\s*ดอลลาร์/gi, 'EURUSD'],
    [/พีพีโอ|บีบีโอ|โอพีพี/gi, 'PPO'],
    [/เอสเอซี|แซค/gi, 'SAC'],
    [/ดีคิวเอ็น/gi, 'DQN'],
    [/ดีพ\s*อาร์แอล|ดีฟ\s*อาร์แอล/gi, 'Deep RL'],
    [/แอคเตอร์\s*คริติก|แอกเตอร์\s*คริติก/gi, 'Actor-Critic'],
    [/รีวอร์ด|รีเวิร์ด|รีวอด/gi, 'Reward Function'],
    [/ออฟติไมซ์|ออปติไมซ์|ออพติไมซ์|ออพติไม/gi, 'Optimize'],
    [/แบคเทส|แบคเทสต์|แบบเทส/gi, 'Backtest'],
    [/ไฮเปอร์พารามิเตอร์|พารามิเตอร์/gi, 'Hyperparameters'],
    [/สเตท\s*สเปซ|สเตทสเปซ/gi, 'State Space'],
    [/ออนนิกซ์|ออนิกซ์/gi, 'ONNX'],
    [/เอ็มคิวแอล|mql5/gi, 'MQL5'],
    [/เอ็มทีเอฟ/gi, 'MTF H4'],
    [/ชาร์ป\s*เรโช|ชาร์ปรัตราส่วน/gi, 'Sharpe Ratio'],
    [/แคนวาส|ผืนผ้าใบ/gi, 'Canvas'],
    [/ต่อ\s*21|ต่อ\s*node|ต่อ\s*โน้ต/gi, 'ต่อ 21 Node ลง Canvas'],
    [/แบทช์\s*ไซส์|แบทไซส์|แบทช์ไซส์/gi, 'Batch Size'],
    [/ไทม์\s*เฟรม|ไทม์เฟรม|ทามเฟรม/gi, 'Timeframe'],
  ];

  for (const [pattern, replacement] of dictionary) {
    text = text.replace(pattern, replacement);
  }

  return text;
};

// 🧠 Intelligent Architecture & Node Synthesizer
const synthesizeBlueprintFromText = (
  query: string,
  aiText: string,
  _currentNodes?: any[]
): ChatMessage['blueprint'] => {
  const lowerQ = query.toLowerCase();
  const lowerA = aiText.toLowerCase();

  // Do not generate blueprint for deletion, project management, or utility intents
  const isExcludedIntent =
    lowerQ.includes('ลบ') ||
    lowerQ.includes('ตัด') ||
    lowerQ.includes('ออก') ||
    lowerQ.includes('ปลด') ||
    lowerQ.includes('ถอด') ||
    lowerQ.includes('ปิด') ||
    lowerQ.includes('ยกเลิก') ||
    lowerQ.includes('ทิ้ง') ||
    lowerQ.includes('ไม่เอา') ||
    lowerQ.includes('เคลียร์') ||
    lowerQ.includes('delete') ||
    lowerQ.includes('remove') ||
    lowerQ.includes('clear') ||
    lowerQ.includes('project') ||
    lowerQ.includes('โปรเจกต์') ||
    lowerQ.includes('โปรเจค') ||
    lowerQ.includes('งานใหม่') ||
    lowerQ.includes('บันทึก') ||
    lowerQ.includes('save') ||
    lowerQ.includes('load') ||
    lowerQ.includes('export') ||
    lowerQ.includes('setting') ||
    lowerQ.includes('theme') ||
    lowerQ.includes('status') ||
    lowerQ.includes('fit view') ||
    lowerA.includes('ลบ') ||
    lowerA.includes('เคลียร์') ||
    lowerA.includes('delete') ||
    lowerA.includes('remove') ||
    lowerA.includes('โปรเจกต์') ||
    lowerA.includes('project');

  if (isExcludedIntent) {
    return undefined;
  }

  const isExplicitRequest =
    (lowerQ.includes('ต่อ') && !lowerQ.includes('ติดต่อ')) ||
    (lowerQ.includes('สร้าง') && (lowerQ.includes('node') || lowerQ.includes('โหนด') || lowerQ.includes('กลยุทธ์') || lowerQ.includes('strategy') || lowerQ.includes('pipeline') || lowerQ.includes('โมเดล') || lowerQ.includes('model') || lowerQ.includes('ระบบ') || lowerQ.includes('สาย') || lowerQ.includes('dag') || lowerQ.includes('ppo') || lowerQ.includes('sac') || lowerQ.includes('dqn'))) ||
    lowerQ.includes('สร้าง node') ||
    lowerQ.includes('สร้างโหนด') ||
    lowerQ.includes('สร้างกลยุทธ์') ||
    lowerQ.includes('ต่อ node') ||
    lowerQ.includes('ต่อโหนด') ||
    lowerQ.includes('วางระบบ') ||
    lowerQ.includes('วาง node') ||
    lowerQ.includes('blueprint') ||
    lowerQ.includes('wire node') ||
    lowerA.includes('คลิกปุ่มด้านล่างเพื่อเชื่อมต่อ') ||
    lowerA.includes('click the button below to load and wire');

  if (!isExplicitRequest) {
    return undefined;
  }

  const combined = `${query} ${aiText}`.toLowerCase();

  // Detect Symbol
  let symbol = 'XAUUSD';
  if (combined.includes('eurusd')) symbol = 'EURUSD';
  else if (combined.includes('gbpusd')) symbol = 'GBPUSD';
  else if (combined.includes('btcusd') || combined.includes('bitcoin')) symbol = 'BTCUSD';
  else if (combined.includes('usdjpy')) symbol = 'USDJPY';
  else if (combined.includes('nas100') || combined.includes('us100')) symbol = 'NAS100';

  // Detect Timeframe
  let timeframe = 'M15';
  if (combined.includes('m1 ') || combined.includes('1m') || combined.includes('scalp')) timeframe = 'M1';
  else if (combined.includes('m5 ') || combined.includes('5m')) timeframe = 'M5';
  else if (combined.includes('h1 ') || combined.includes('1h')) timeframe = 'H1';
  else if (combined.includes('h4 ') || combined.includes('4h')) timeframe = 'H4';
  else if (combined.includes('d1 ') || combined.includes('daily')) timeframe = 'D1';

  // Detect Preset / Strategy Theme
  let preset = 'Gold Trend Scalper (M15)';
  let bpName = `${symbol} Alpha PPO`;
  if (combined.includes('mean revert') || combined.includes('reversion') || combined.includes('range')) {
    preset = 'Mean Reversion (M5)';
    bpName = `${symbol} Range Neutral PPO`;
  } else if (combined.includes('breakout') || combined.includes('volatility')) {
    preset = 'Breakout Volatility (H1)';
    bpName = `${symbol} Volatility Breakout`;
  } else if (combined.includes('orderflow') || combined.includes('institutional')) {
    preset = 'Orderflow Confluence (M15)';
    bpName = `${symbol} Deep RL Quant`;
  }

  // Detect Neural Activations & Units
  const units1 = combined.includes('128') ? 128 : combined.includes('256') ? 256 : 64;
  const units2 = combined.includes('64') ? 64 : combined.includes('128') ? 128 : 32;
  const act1 = combined.includes('mish') ? 'Mish' : combined.includes('gelu') ? 'GELU' : combined.includes('relu') ? 'ReLU' : 'LeakyReLU';
  const act2 = combined.includes('gelu') ? 'GELU' : combined.includes('mish') ? 'Mish' : 'LeakyReLU';
  const dropout = combined.includes('dropout') && combined.includes('0.2') ? 0.2 : 0.15;

  // Build the complete 21-Node Canonical Institutional DAG
  const baseNodes = INITIAL_NODES.map((n) => ({ ...n, data: { ...n.data } }));
  const tunedNodes = autoTunePipelineNodes(preset, baseNodes).map((node) => {
    const type = node.data?.nodeType || node.type;
    const d = { ...(node.data || {}) };

    if (type === 'strategy_preset_return') {
      d.symbol = symbol;
      d.timeframe = timeframe;
      d.preset = preset;
      d.execution = { status: 'passed', detail: `AI Auto-Assembled: ${symbol} ${timeframe}` };
    } else if (type === 'fc1_dense_expansion') {
      d.units = String(units1);
      d.activation = act1;
      d.execution = { status: 'passed', detail: `AI Synthesized: 6 to ${units1} (${act1})` };
    } else if (type === 'spatial_dropout_regularization') {
      d.rate = dropout;
      d.execution = { status: 'passed', detail: `AI Regularization: Dropout ${dropout}` };
    } else if (type === 'fc2_bottleneck_synthesizer') {
      d.units = String(units2);
      d.activation = act2;
      d.execution = { status: 'passed', detail: `AI Bottleneck: ${units1} to ${units2} (${act2})` };
    } else if (type === 'fc3_policy_action_head') {
      d.classes = '3';
      d.execution = { status: 'passed', detail: 'AI Policy Softmax: 3 Actions (BUY, HOLD, SELL)' };
    }
    return { ...node, data: d };
  });

  return {
    name: bpName,
    strategyPreset: preset,
    symbol,
    timeframe,
    description: `Institutional 21-DAG Architecture with ${units1} Dense (${act1}) & ${units2} (${act2})`,
    layersSummary: `6 Inputs → ${units1} (${act1}) → Dropout(${dropout}) → ${units2} (${act2}) → 3 Actions`,
    nodes: tunedNodes,
    edges: INITIAL_EDGES,
  };
};

//  Interactive Code Block with Copy Button and macOS Terminal Styling
const CodeBlock: React.FC<{ language?: string; code: string; isLight: boolean }> = ({
  language,
  code,
  isLight,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const displayLang = (language || 'code').toUpperCase();

  return (
    <div
      style={{
        margin: '10px 0',
        borderRadius: '10px',
        overflow: 'hidden',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.10)',
        backgroundColor: isLight ? '#1c1d22' : '#0e0e12',
        boxShadow: isLight ? '0 4px 14px rgba(0, 0, 0, 0.08)' : '0 6px 24px rgba(0, 0, 0, 0.55)',
        fontFamily: 'var(--font-apple-text)',
      }}
    >
      {/* Code Block Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          backgroundColor: isLight ? '#16171b' : '#141419',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
          </div>
          <span
            style={{
              marginLeft: '6px',
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'rgba(255, 255, 255, 0.55)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {displayLang}
          </span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '6px',
            backgroundColor: copied ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            border: copied ? '1px solid rgba(48, 209, 88, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
            color: copied ? '#30d158' : 'rgba(255, 255, 255, 0.85)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: 'none',
          }}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <LucideIcons.Check size={12} strokeWidth={2.5} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <LucideIcons.Copy size={12} strokeWidth={2} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Content */}
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          overflowX: 'auto',
          fontSize: '11.5px',
          lineHeight: '1.6',
          color: '#e6edf3',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          whiteSpace: 'pre',
          tabSize: 2,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderInlineMarkdown = (text: string, isLight: boolean, keyPrefix: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return (
    <span key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong
              key={idx}
              style={{
                fontWeight: 600,
                color: isLight ? '#111827' : 'rgba(255, 255, 255, 0.90)',
              }}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span
              key={idx}
              style={{
                fontWeight: 400,
                color: isLight ? '#374151' : 'rgba(255, 255, 255, 0.80)',
              }}
            >
              {part.slice(1, -1)}
            </span>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={idx}
              style={{
                fontSize: '11px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)',
                color: isLight ? '#0071e3' : '#38bdf8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return (
          <span
            key={idx}
            style={{
              fontWeight: 400,
              color: isLight ? '#374151' : 'rgba(255, 255, 255, 0.74)',
            }}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
};

const normalizeCodeInText = (rawText: string): string => {
  let text = rawText;

  // 1. Fix single or double backtick language openers: `mql5\n, ``mql5\n, `python\n, etc.
  text = text.replace(/(?:^|\n)`{1,2}(mql5|mq5|python|py|cpp|c|json|sql|bash|sh|pinescript|onnx)\b\s*\n/gi, '\n```$1\n');

  // 2. Fix single backtick without language if followed by MQL5/C header: `\n//+--- or `//+---
  text = text.replace(/(?:^|\n)`\s*(\/\/\+[-=]{5,})/g, '\n```mql5\n$1');

  // 3. If raw MQL5 header exists without any backtick, wrap it:
  if (!text.includes('```') && (text.includes('//+----') || text.includes('#property copyright') || text.includes('#include <Trade'))) {
    const mqlMatch = text.match(/(?:\/\/\+[-=]{5,}|#property\s+|#include\s+<)/);
    if (mqlMatch && mqlMatch.index !== undefined) {
      const before = text.slice(0, mqlMatch.index).trimEnd();
      const codePart = text.slice(mqlMatch.index).trimEnd();
      text = before ? `${before}\n\n\`\`\`mql5\n${codePart}\n\`\`\`` : `\`\`\`mql5\n${codePart}\n\`\`\``;
    }
  }

  // 4. If raw Python script exists without backticks:
  if (!text.includes('```') && (text.includes('import numpy') || text.includes('import torch') || text.includes('import onnx') || text.includes('def onnx_infer('))) {
    const pyMatch = text.match(/(?:import\s+(?:numpy|torch|onnx|pandas)|def\s+[a-zA-Z0-9_]+\s*\(|from\s+[a-zA-Z0-9_]+\s+import)/);
    if (pyMatch && pyMatch.index !== undefined) {
      const before = text.slice(0, pyMatch.index).trimEnd();
      const codePart = text.slice(pyMatch.index).trimEnd();
      text = before ? `${before}\n\n\`\`\`python\n${codePart}\n\`\`\`` : `\`\`\`python\n${codePart}\n\`\`\``;
    }
  }

  // 5. Ensure unclosed code blocks are closed
  const backtickCount = (text.match(/```/g) || []).length;
  if (backtickCount % 2 !== 0) {
    text = `${text}\n\`\`\``;
  }

  return text;
};

//  Full Markdown & Code Block Text Renderer
const renderFormattedText = (rawText: string, isLight: boolean) => {
  if (!rawText) return null;

  const text = normalizeCodeInText(rawText);

  // Split by triple-backtick fenced code blocks: ```lang\ncode```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push(renderInlineMarkdown(textBefore, isLight, `inline-${lastIndex}`));
    }

    const language = match[1] || '';
    const code = match[2] || '';
    elements.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code.trimEnd()}
        isLight={isLight}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex);
    elements.push(renderInlineMarkdown(textAfter, isLight, `inline-${lastIndex}`));
  }

  return <>{elements}</>;
};

interface MacOSAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  blueprint?: {
    name: string;
    strategyPreset: string;
    symbol: string;
    timeframe: string;
    description: string;
    layersSummary: string;
    nodes: any[];
    edges: any[];
  };
}

const RANDOM_ROBOT_GREETINGS = [
  'How can I assist with your trading strategy or DAG architecture today?',
  'Ready to optimize policy hyperparameters and train Deep RL models.',
  'I can assemble 21 nodes onto your canvas or evaluate your state space.',
  'Ready to configure Actor-Critic policies for XAUUSD, EURUSD, or your target asset.',
  'FXFORGE Copilot is on standby. Type your prompt below to get started.',
  'Need help formulating reward functions or configuring ONNX export?',
];

export const MacOSAssistantSidebar: React.FC<MacOSAssistantSidebarProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { nodes, edges, architectureSpec, setNodes, setEdges, syncArchitectureToEngine } = useFlow();

  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appliedBlueprint, setAppliedBlueprint] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(() => Math.floor(Math.random() * RANDOM_ROBOT_GREETINGS.length));

  const [voiceLang, setVoiceLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<{
    status: 'ready' | 'local' | 'error' | 'testing';
    label: string;
    detail?: string;
  }>({
    status: 'ready',
    label: 'AI Ready',
  });

  const checkApiConnection = async () => {
    try {
      const settings = getAISettings();
      const hasKey = Boolean(settings.apiKey && settings.apiKey.trim()) || settings.provider === 'ollama';
      if (hasKey) {
        const res = await testAIConnection(settings);
        if (res.success) {
          setApiStatus({
            status: 'ready',
            label: 'AI Ready',
            detail: `${settings.model || settings.provider.toUpperCase()} (${res.latencyMs}ms)`,
          });
        } else {
          setApiStatus({
            status: 'error',
            label: 'API Error',
            detail: res.message,
          });
        }
      } else {
        setApiStatus({
          status: 'local',
          label: 'Local Engine',
          detail: 'Built-in Offline Engine (No API Key)',
        });
      }
    } catch (_) {
      setApiStatus({
        status: 'local',
        label: 'Local Engine',
        detail: 'Local Fallback',
      });
    }
  };

  useEffect(() => {
    checkApiConnection();
    const handleSettingsUpdate = () => {
      checkApiConnection();
    };
    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('fxforge-ai-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('fxforge-ai-settings-updated', handleSettingsUpdate);
    };
  }, [isOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const isVoiceActiveRef = useRef<boolean>(false);
  const inputTextRef = useRef<string>(inputText);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // 🎙️ Real Web Speech Recognition Engine + Real Microphone AudioContext Level Analyzer
  const startVoiceListening = async () => {
    try {
      // 1. Initialize Real Microphone Audio Stream & Volume Analyzer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!isVoiceActiveRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
              animFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
          }
        } catch (permErr) {
          console.warn('Microphone stream error:', permErr);
        }
      }

      // 2. Initialize Web Speech Recognition Engine
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('SpeechRecognition API not available in this browser.');
        setIsSpeaking(true);
        isVoiceActiveRef.current = true;
        setSpeechStatus('Listening (No SpeechRecognition API)...');
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsSpeaking(true);
        isVoiceActiveRef.current = true;
        setSpeechStatus(voiceLang === 'th-TH' ? 'กำลังฟังภาษาไทย...' : 'Listening (English)...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        const rawText = (final || interim).trim();
        if (rawText) {
          const normalized = normalizeQuantVoiceInput(rawText);
          latestTranscriptRef.current = normalized;
          setSpeechStatus(normalized);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechStatus('Microphone blocked');
          setIsSpeaking(false);
          isVoiceActiveRef.current = false;
        } else if (event.error === 'network') {
          setSpeechStatus('Network error');
        }
      };

      recognition.onend = () => {
        // Keep listening active while user is still in recording mode
        if (isVoiceActiveRef.current) {
          setTimeout(() => {
            if (isVoiceActiveRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (_) {}
            }
          }, 120);
        } else {
          setIsSpeaking(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isVoiceActiveRef.current = true;
      setIsSpeaking(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsSpeaking(true);
      isVoiceActiveRef.current = true;
    }
  };

  const stopVoiceListening = (autoSend: boolean = true) => {
    isVoiceActiveRef.current = false;
    setIsSpeaking(false);
    const recordedAudio = audioLevel;
    setAudioLevel(0);
    setSpeechStatus('');

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    const transcript = (latestTranscriptRef.current || inputTextRef.current).trim();

    // 🧹 Clean input field immediately after voice release - no typed leftovers
    latestTranscriptRef.current = '';
    setInputText('');
    inputTextRef.current = '';

    if (autoSend) {
      if (transcript) {
        handleSendQuery(transcript, true);
      } else if (recordedAudio > 5) {
        handleSendQuery('Optimize Gold M15 strategy and formulate reward function', true);
      }
    }
  };

  // Cancel Voice Listening (Esc key abort with zero explanation or residual input)
  const cancelVoiceListening = () => {
    setIsSpeaking(false);
    setSpeechStatus('');
    setAudioLevel(0);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    latestTranscriptRef.current = '';
    setInputText('');
    inputTextRef.current = '';
  };

  // Keyboard shortcut: Spacebar hold to speak / Esc to cancel voice listening
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSpeaking) {
          e.preventDefault();
          e.stopPropagation();
          cancelVoiceListening();
          return;
        }
      }

      if (e.code === 'Space' && document.activeElement !== inputRef.current && !e.repeat) {
        e.preventDefault();
        startVoiceListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        stopVoiceListening(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, voiceLang, isSpeaking]);

  // 1. Auto-scroll to latest message immediately on new message or thinking state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 HIGH-IQ QUANT SEMANTIC INTENT & ACTION PROTOCOL (ONLINE & OFFLINE)
// ═══════════════════════════════════════════════════════════════════════════════

interface SemanticResolution {
  replyText: string;
  actions: CopilotAction[];
  blueprint?: ChatMessage['blueprint'];
}

const resolveSmartQuantIntelligence = (
  query: string,
  currentNodes: any[],
  _currentEdges: any[] = [],
  architectureSpec?: any
): SemanticResolution => {
  const lower = query.toLowerCase().trim();
  const isThai = /[\u0E00-\u0E7F]/.test(query);
  const baseNodes = Array.isArray(currentNodes) && currentNodes.length > 0 ? currentNodes : INITIAL_NODES;
  const currentSymbol = architectureSpec?.symbol || 'XAUUSD';
  const currentTimeframe = architectureSpec?.timeframe || 'M15';

  // 0.05 🗑️ DELETE ALL SAVED PROJECTS FROM LOAD / LIBRARY ("ลบ Project ทั้งหมดจากหน้าโหลด", "ลบโปรเจกต์ทั้งหมด", "ลบไฟล์ในหน้าโหลด")
  const isDeleteAllProjects =
    (lower.includes('ลบ') ||
      lower.includes('เคลียร์') ||
      lower.includes('ล้าง') ||
      lower.includes('delete') ||
      lower.includes('clear') ||
      lower.includes('wipe') ||
      lower.includes('reset') ||
      lower.includes('โละ')) &&
    (lower.includes('project') || lower.includes('โปรเจกต์') || lower.includes('โปรเจค') || lower.includes('ไฟล์') || lower.includes('งาน')) &&
    (lower.includes('หน้าโหลด') || lower.includes('โหลด') || lower.includes('load') || lower.includes('library') || lower.includes('คลัง') || lower.includes('ทั้งหมด') || lower.includes('all'));

  if (isDeleteAllProjects) {
    return {
      replyText: isThai
        ? 'น้องจัดการ **ลบรายการโปรเจกต์ทั้งหมด** ออกจากหน้าต่าง Load Project และระบบบันทึกให้เรียบร้อยแล้วนะคะ! ตอนนี้คลังโปรเจกต์ว่างเปล่า 100% แล้วค่ะ'
        : 'All saved projects have been permanently deleted from the Load Project Library as requested.',
      actions: [{ type: 'DELETE_ALL_PROJECTS' }],
    };
  }

  // 0. 🌟 CREATE NEW BLANK PROJECT INTENT ("สร้าง New Project", "สร้างโปรเจกต์ใหม่", "new project", "สร้างงานใหม่", "สร้าง Project ใหม่ ชื่อ...")
  const isNewProject =
    lower.includes('new project') ||
    lower.includes('โปรเจกต์ใหม่') ||
    lower.includes('โปรเจคใหม่') ||
    lower.includes('งานใหม่') ||
    ((lower.includes('project') || lower.includes('โปรเจกต์') || lower.includes('โปรเจค') || lower.includes('งาน')) &&
      (lower.includes('สร้าง') || lower.includes('new') || lower.includes('ใหม่') || lower.includes('เปิดใหม่')));

  if (isNewProject) {
    let customName = 'Untitled Project';
    const nameMatch =
      query.match(/(?:ชื่อ|name|called)\s*[:=]?\s*["']?([^"'\n,]+)["']?/i) ||
      query.match(/(?:สร้าง|create|new)\s+(?:project|โปรเจกต์|โปรเจค)?\s*["']?([A-Za-z0-9_-]+)["']?/i);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim()) {
      const extracted = nameMatch[1].trim();
      if (!['ใหม่', 'new', 'project', 'โปรเจกต์', 'โปรเจค'].includes(extracted.toLowerCase())) {
        customName = extracted;
      }
    }

    return {
      replyText: isThai
        ? `น้องได้สร้างโปรเจกต์ใหม่ชื่อ **"${customName}"** ให้เรียบร้อยแล้วนะคะ พร้อมสำหรับการเริ่มต้นออกแบบและวางโครงสร้างโมเดลใหม่แล้วค่ะ`
        : `Created a new project named **"${customName}"** with a clean blank canvas. Ready for your new pipeline architecture.`,
      actions: [{ type: 'NEW_PROJECT', projectName: customName }],
      blueprint: undefined,
    };
  }

  // 0.1 🚀 START / RUN TRAINING INTENT ("เริ่มเทรน", "รัน", "start", "start training", "เทรนโมเดล")
  const isStartTraining =
    (lower.includes('start') ||
      lower.includes('เริ่มเทรน') ||
      lower.includes('เริ่มรัน') ||
      lower.includes('รัน') ||
      lower.includes('เทรน') ||
      lower.includes('train') ||
      lower.includes('เริ่มจำลอง') ||
      lower.includes('เริ่มการเทรน') ||
      lower.includes('execute training')) &&
    !lower.includes('หยุด') &&
    !lower.includes('stop') &&
    !lower.includes('pause') &&
    !lower.includes('พัก');

  if (isStartTraining) {
    return {
      replyText: isThai
        ? 'น้องสั่ง **START** เริ่มต้นการเทรน Deep RL Simulation ให้เรียบร้อยแล้วนะคะ! ระบบกำลังประมวลผลผ่าน Real PyTorch Engine และสตรีมค่า Telemetry แบบ Real-time ค่ะ'
        : 'Instructed **START**: Real PyTorch Deep RL Training simulation has commenced. Streaming real-time telemetry.',
      actions: [{ type: 'START_TRAINING' }],
    };
  }

  // 0.2 ⏸️ PAUSE TRAINING INTENT ("หยุดชั่วคราว", "พัก", "pause", "pause training")
  const isPauseTraining =
    lower.includes('pause') ||
    lower.includes('หยุดชั่วคราว') ||
    lower.includes('พักการเทรน') ||
    lower.includes('พักรัน') ||
    lower.includes('พักเทรน') ||
    lower.includes('พักไว้ก่อน');

  if (isPauseTraining) {
    return {
      replyText: isThai
        ? 'น้องสั่ง **PAUSE** พักการเทรน DRL ชั่วคราวให้เรียบร้อยแล้วนะคะ คุณสามารถสั่งเริ่มต่อ (START) ได้ทุกเมื่อค่ะ'
        : 'Instructed **PAUSE**: DRL simulation is paused. You can resume anytime by saying START.',
      actions: [{ type: 'PAUSE_TRAINING' }],
    };
  }

  // 0.3 ⏹️ STOP TRAINING INTENT ("หยุดเทรน", "stop", "stop training", "ยกเลิกการเทรน")
  const isStopTraining =
    (lower.includes('stop') ||
      lower.includes('หยุดเทรน') ||
      lower.includes('หยุดการเทรน') ||
      lower.includes('ยกเลิกการเทรน') ||
      lower.includes('รีเซ็ตการเทรน') ||
      lower.includes('หยุดรัน')) &&
    !isPauseTraining;

  if (isStopTraining) {
    return {
      replyText: isThai
        ? 'น้องสั่ง **STOP** หยุดการเทรนและรีเซ็ตสภาพแวดล้อมกลับสู่ค่าเริ่มต้นให้เรียบร้อยแล้วนะคะ'
        : 'Instructed **STOP**: Training session halted and reset to baseline.',
      actions: [{ type: 'STOP_TRAINING' }],
    };
  }

  // 0.4 💾 SAVE PROJECT INTENT ("บันทึก", "เซฟ", "save", "save project")
  const isSaveProject =
    (lower.includes('save') ||
      lower.includes('บันทึก') ||
      lower.includes('เซฟ') ||
      lower.includes('เก็บโปรเจกต์')) &&
    !lower.includes('ลบ') &&
    !lower.includes('delete');

  if (isSaveProject) {
    return {
      replyText: isThai
        ? 'น้องจัดการ **SAVE** บันทึกโครงสร้าง Node, Parameter และ Architecture ทั้งหมดลงใน Project Manager ให้เรียบร้อยแล้วนะคะ!'
        : 'Strategy and DAG pipeline successfully saved to Project Manager library.',
      actions: [{ type: 'SAVE_PROJECT' }],
    };
  }

  // 0.5 📂 LOAD PROJECT / PROJECT MANAGER INTENT ("โหลดโปรเจกต์", "เปิดโปรเจกต์", "load project", "open project")
  const isLoadProject =
    lower.includes('load') ||
    lower.includes('โหลด') ||
    lower.includes('open project') ||
    lower.includes('เปิดโปรเจกต์') ||
    lower.includes('เปิด project') ||
    lower.includes('ดึงงาน') ||
    lower.includes('project manager') ||
    lower.includes('โปรเจกต์เมเนเจอร์');

  if (isLoadProject) {
    return {
      replyText: isThai
        ? 'น้องเปิดหน้าต่าง **Project Manager** ให้เรียบร้อยแล้วนะคะ คุณสามารถเลือกโหลด Duplicate หรือจัดการโปรเจกต์ทั้งหมดได้เลยค่ะ'
        : 'Opened **Project Manager**. You can load, inspect, or manage all saved strategies.',
      actions: [{ type: 'OPEN_MODAL', modalName: 'projects' }],
    };
  }

  // 0.6 📦 EXPORT PROJECT INTENT ("export", "ส่งออก", "ดาวน์โหลดไฟล์")
  const isExportProject =
    lower.includes('export') ||
    lower.includes('ส่งออก') ||
    lower.includes('ดาวน์โหลดไฟล์') ||
    lower.includes('ดาวน์โหลด json') ||
    lower.includes('export project');

  if (isExportProject) {
    return {
      replyText: isThai
        ? 'น้องจัดการ **EXPORT** ส่งออกไฟล์โปรเจกต์ (JSON) สำหรับนำไปใช้และสำรองข้อมูลให้เรียบร้อยแล้วนะคะ!'
        : 'Exported active strategy project file to your system.',
      actions: [{ type: 'EXPORT_PROJECT', exportType: 'json' }],
    };
  }

  // 0.7 ⚡ DEPLOY MT5 / MQL5 INTENT ("deploy", "ส่งไป mt5", "ติดตั้ง mt5", "เปิด mt5 deploy")
  const isDeployMT5 =
    lower.includes('deploy') ||
    lower.includes('mt5') ||
    lower.includes('mql5') ||
    lower.includes('ติดตั้ง') ||
    lower.includes('ส่งไป mt5') ||
    lower.includes('ติดตั้ง ea') ||
    lower.includes('export onnx') ||
    lower.includes('ส่งออก ea');

  if (isDeployMT5) {
    return {
      replyText: isThai
        ? 'น้องเปิดหน้าต่าง **MT5 / MQL5 Deployment Hub** ให้เรียบร้อยแล้วนะคะ พร้อมส่งออก ONNX Brain และประกอบ Expert Advisor ไปยัง MetaTrader 5 ทันทีค่ะ'
        : 'Opened **MT5 Deployment Hub**. Ready to compile and transfer ONNX model and MQL5 EA to your MetaTrader terminal.',
      actions: [{ type: 'OPEN_MODAL', modalName: 'deploy' }],
    };
  }

  // 0.8 🎯 RESET CAMERA / FIT VIEW INTENT ("จัดหน้าจอ", "fit view", "reset camera", "รีเซ็ตมุมมอง")
  const isResetCam =
    lower.includes('fit view') ||
    lower.includes('reset camera') ||
    lower.includes('จัดหน้าจอ') ||
    lower.includes('รีเซ็ตมุมมอง') ||
    lower.includes('จัดกึ่งกลาง') ||
    lower.includes('ขยายให้พอดี') ||
    lower.includes('จัดมุมมอง');

  if (isResetCam) {
    return {
      replyText: isThai
        ? 'น้องจัดกึ่งกลางและรีเซ็ตมุมมองหน้าจอ Flow Canvas (Fit View) ให้เห็นทุก Node ชัดเจนเรียบร้อยแล้วนะคะ'
        : 'Adjusted and centered the canvas camera (Fit View).',
      actions: [{ type: 'RESET_CAMERA' }],
    };
  }

  // 0.9 🌓 THEME TOGGLE INTENT ("เปลี่ยนธีม", "สว่าง", "มืด", "dark mode", "light mode")
  const isThemeToggle =
    lower.includes('theme') ||
    lower.includes('ธีม') ||
    lower.includes('dark mode') ||
    lower.includes('light mode') ||
    lower.includes('สว่าง') ||
    lower.includes('มืด');

  if (
    isThemeToggle &&
    (lower.includes('เปลี่ยน') ||
      lower.includes('สลับ') ||
      lower.includes('ปรับ') ||
      lower.includes('toggle') ||
      lower.includes('switch'))
  ) {
    return {
      replyText: isThai
        ? 'น้องสลับธีมการแสดงผล (Light / Dark Mode) ให้เรียบร้อยแล้วนะคะ'
        : 'Switched application theme mode.',
      actions: [{ type: 'TOGGLE_THEME' }],
    };
  }

  // 0.10 ⚙️ OPEN SETTINGS INTENT ("เปิดตั้งค่า", "เปิด ai settings", "settings")
  const isOpenSettings =
    lower.includes('settings') ||
    lower.includes('ตั้งค่า') ||
    lower.includes('ai settings') ||
    lower.includes('api key');

  if (
    isOpenSettings &&
    (lower.includes('เปิด') || lower.includes('open') || lower.includes('ไปที่') || lower.includes('ดู'))
  ) {
    return {
      replyText: isThai
        ? 'น้องเปิดหน้าต่าง **AI & Quant Settings** สำหรับตั้งค่า API Key และโมเดล LLM ให้เรียบร้อยแล้วนะคะ'
        : 'Opened **AI Settings** modal.',
      actions: [{ type: 'OPEN_MODAL', modalName: 'settings' }],
    };
  }

  // 0.11 🖥️ EXPAND / RESTORE SIDEBAR TO FULL CANVAS ("ขยายเต็มหน้า", "ขยาย AI", "ย่อ AI", "เต็มจอ", "maximize", "fullscreen")
  if (
    lower.includes('ขยายเต็ม') ||
    lower.includes('ขยายหน้าต่าง') ||
    lower.includes('เต็มหน้า') ||
    lower.includes('เต็ม canvas') ||
    lower.includes('เต็มจอ') ||
    lower.includes('maximize') ||
    lower.includes('fullscreen')
  ) {
    window.dispatchEvent(new CustomEvent('fxforge-ai-toggle-expand', { detail: { expanded: true } }));
    return {
      replyText: isThai
        ? 'น้อง **ขยายหน้าต่าง Copilot เต็มพื้นที่ Canvas** ให้เรียบร้อยแล้วนะคะ เพื่อให้อ่านโค้ดและวิเคราะห์กลยุทธ์ได้อย่างกว้างขวางสบายตาค่ะ'
        : 'Expanded Copilot window to cover the full canvas workspace.',
      actions: [],
    };
  }

  if (
    lower.includes('ย่อหน้าต่าง') ||
    lower.includes('ย่อขนาด') ||
    lower.includes('ย่อกลับ') ||
    lower.includes('ย่อ ai') ||
    lower.includes('minimize') ||
    lower.includes('restore')
  ) {
    window.dispatchEvent(new CustomEvent('fxforge-ai-toggle-expand', { detail: { expanded: false } }));
    return {
      replyText: isThai
        ? 'น้อง **ย่อหน้าต่าง Copilot กลับเป็นแถบด้านข้าง** ให้เรียบร้อยแล้วนะคะ'
        : 'Restored Copilot back to compact sidebar mode.',
      actions: [],
    };
  }

  // 1. 🗑️ CLEAR / DELETE ALL INTENT (100% Comprehensive Synonym Coverage)
  const isClearAll =
    (lower.includes('ลบ') || lower.includes('เคลียร์') || lower.includes('กวาด') || lower.includes('โละ') || lower.includes('ทิ้ง') || lower.includes('ล้าง') || lower.includes('เอาออก') || lower.includes('ปลด') || lower.includes('delete') || lower.includes('clear') || lower.includes('remove') || lower.includes('wipe') || lower.includes('reset') || lower.includes('purge')) &&
    (lower.includes('ทั้งหมด') || lower.includes('ทุก') || lower.includes('all') || lower.includes('canvas') || lower.includes('กระดาน') || lower.includes('ทั้ง') || lower.includes('ทุกโหนด') || lower.includes('ทุกnode') || lower.includes('nodeทั้งหมด') || lower.includes('โหนดทั้งหมด') || lower.includes('หมด'));

  if (isClearAll || lower === 'ลบ' || lower === 'clear' || lower === 'reset' || lower === 'delete all' || lower === 'ลบทั้งหมด') {
    return {
      replyText: isThai
        ? 'น้องลบ Node และ Edge ทั้งหมดออกจาก Canvas เรียบร้อยแล้วนะคะ ตอนนี้พื้นที่ว่างเปล่า 100% พร้อมสำหรับการออกแบบ Pipeline ใหม่แล้วค่ะ'
        : 'All nodes and connections have been cleared from the Flow Canvas. The canvas is now blank and ready for a fresh pipeline.',
      actions: [{ type: 'CLEAR_CANVAS' }],
      blueprint: undefined,
    };
  }

  // 2. ✂️ SPECIFIC NODE DELETION INTENT
  const isDeleteSpecific =
    lower.includes('ลบ') ||
    lower.includes('ตัด') ||
    lower.includes('ออก') ||
    lower.includes('ปลด') ||
    lower.includes('ถอด') ||
    lower.includes('ปิด') ||
    lower.includes('ยกเลิก') ||
    lower.includes('ทิ้ง') ||
    lower.includes('ไม่เอา') ||
    lower.includes('delete') ||
    lower.includes('remove') ||
    lower.includes('drop') ||
    lower.includes('unlink') ||
    lower.includes('detach') ||
    lower.includes('exclude');

  if (isDeleteSpecific) {
    const NODE_KEYWORD_MAP = [
      { keywords: ['news', 'ข่าว', 'impact', 'news filter', 'impact filter'], nodeType: 'news_impact_filter', label: 'News Impact Filter' },
      { keywords: ['volatility', 'ผันผวน', 'atr', 'indicator'], nodeType: 'volatility_indicator', label: 'Volatility & Indicator' },
      { keywords: ['position', 'feedback', 'โพสิชั่น'], nodeType: 'position_feedback', label: 'Position Feedback' },
      { keywords: ['multi', 'timeframe', 'mtf', 'fusion', 'เฟรม'], nodeType: 'multi_timeframe_fusion', label: 'Multi-Timeframe Fusion' },
      { keywords: ['session', 'ลอนดอน', 'london', 'day filter', 'session filter'], nodeType: 'session_time_filter', label: 'Session & Day Filter' },
      { keywords: ['training', 'episode', 'target', 'รอบ'], nodeType: 'training_episodes_config', label: 'Training Episodes & Target' },
      { keywords: ['dense', 'fc1', 'expansion', 'ขยาย'], nodeType: 'fc1_dense_expansion', label: 'Dense Feature Expansion' },
      { keywords: ['attention', 'saliency', 'ความสนใจ'], nodeType: 'fc1_attention_weights', label: 'Attention Feature Saliency' },
      { keywords: ['dropout', 'ดรอปเอาท์', 'spatial dropout'], nodeType: 'spatial_dropout_regularization', label: 'Spatial Feature Dropout' },
      { keywords: ['norm', 'normalization', 'นอร์ม', 'layer norm'], nodeType: 'layer_normalization', label: 'Layer Normalization' },
      { keywords: ['gradient', 'clip', 'คลิป'], nodeType: 'gradient_clipping', label: 'Gradient Clipping' },
      { keywords: ['bottleneck', 'fc2', 'synthesizer', 'บอตเทิลเน็ค'], nodeType: 'fc2_bottleneck_synthesizer', label: 'Bottleneck Compression' },
      { keywords: ['friction', 'spread', 'สเปรด', 'spread cost', 'spread guard'], nodeType: 'friction_spread_cost', label: 'Friction & Spread Guard' },
      { keywords: ['idle', 'inactivity', 'ไม่เทรด', 'นิ่ง'], nodeType: 'anti_inactivity_reward', label: 'Anti-Inactivity Reward' },
      { keywords: ['drawdown', 'dd', 'ดรอว์ดาวน์', 'drawdown penalty'], nodeType: 'drawdown_guard_penalty', label: 'Drawdown Guard Penalty' },
      { keywords: ['policy', 'action', 'fc3', 'เฮด'], nodeType: 'fc3_policy_action_head', label: 'Action Softmax Policy Head' },
      { keywords: ['dynamic lot', 'lot sizer', 'ความเสี่ยง', 'ล็อต', 'lot'], nodeType: 'dynamic_lot_sizer', label: 'Dynamic Lot Sizer' },
      { keywords: ['trailing', 'breakeven', 'เทรล', 'trailing stop'], nodeType: 'trailing_stop_breakeven', label: 'Breakeven & Trail' },
      { keywords: ['monte carlo', 'stress'], nodeType: 'monte_carlo_stress_test', label: 'Monte Carlo Validation' },
      { keywords: ['walk forward', 'วอล์ค'], nodeType: 'walk_forward_robustness', label: 'Walk-Forward Split' },
      { keywords: ['onnx', 'compiler', 'export', 'mt5'], nodeType: 'onnx_mt5_compiler', label: 'ONNX Compiler Export' },
      { keywords: ['telegram', 'webhook', 'alert', 'แจ้งเตือน'], nodeType: 'telegram_webhook_alert', label: 'Telegram Webhook Alert' },
    ];

    let targetNode = baseNodes.find((node) => {
      const type = (node.data?.nodeType || node.type || '').toLowerCase();
      const title = (node.data?.label || node.data?.title || '').toLowerCase();

      for (const item of NODE_KEYWORD_MAP) {
        if (item.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
          if (type.includes(item.nodeType) || title.includes(item.label.toLowerCase())) {
            return true;
          }
        }
      }
      return false;
    });

    if (!targetNode) {
      const indexMatch = query.match(/(?:node|โหนด)[^\d]*(\d+)/i);
      if (indexMatch) {
        targetNode = baseNodes.find((n) => n.id === `node-${indexMatch[1]}` || n.id === indexMatch[1]);
      }
    }

    if (targetNode) {
      const targetLabel = targetNode.data?.label || targetNode.data?.title || targetNode.data?.nodeType || 'Node';
      return {
        replyText: isThai
          ? `รับทราบค่ะ! ดำเนินการปลดโหนด **'${targetLabel}'** ออกจาก Flow Canvas และตัดสายเชื่อมต่อให้เรียบร้อยแล้วนะคะ`
          : `Removed node **'${targetLabel}'** and pruned all associated DAG connections.`,
        actions: [{ type: 'DELETE_NODE', nodeId: targetNode.id, nodeType: targetNode.data?.nodeType }],
        blueprint: undefined,
      };
    }
  }

  // 2.5 🧩 ADD / INSERT NODE INTENT ("เพิ่มโหนด News Impact Filter", "ใส่ Layer Norm", "เพิ่ม Attention Heads")
  const isAddNode =
    (lower.includes('เพิ่ม') ||
      lower.includes('ใส่') ||
      lower.includes('ต่อโหนด') ||
      lower.includes('วางโหนด') ||
      lower.includes('สร้างโหนด') ||
      lower.includes('add node') ||
      lower.includes('insert node') ||
      lower.includes('add')) &&
    !lower.includes('ลบ') &&
    !lower.includes('delete') &&
    !lower.includes('remove');

  const matchedAddType = resolveNodeTypeFromQuery(query);
  if (isAddNode && matchedAddType) {
    const def = NODE_DEFS[matchedAddType];
    const label = def?.label || matchedAddType;
    return {
      replyText: isThai
        ? `น้องเพิ่มโหนด **"${label}"** (${def?.group?.toUpperCase() || 'NODE'}) ลงบน Flow Canvas ให้เรียบร้อยแล้วนะคะ!`
        : `Added node **"${label}"** into your Flow Canvas workspace.`,
      actions: [{ type: 'ADD_NODE', nodeType: matchedAddType }],
    };
  }

  // 2.6 📐 AUTO-LAYOUT / ARRANGE ALL NODES INTENT ("จัดเรียงโหนด", "จัดระเบียบ", "auto layout")
  const isAutoLayout =
    lower.includes('จัดเรียง') ||
    lower.includes('จัดระเบียบ') ||
    lower.includes('จัดผัง') ||
    lower.includes('auto layout') ||
    lower.includes('arrange nodes') ||
    lower.includes('จัด layout') ||
    lower.includes('จัดคอลัมน์');

  if (isAutoLayout) {
    return {
      replyText: isThai
        ? 'น้องจัดเรียงตำแหน่ง Node ทั้งหมดบน Canvas แยกตาม 6 คอลัมน์อย่างเป็นระเบียบสวยงามให้เรียบร้อยแล้วนะคะ'
        : 'Auto-arranged all nodes into clean 6-column pipeline layout.',
      actions: [{ type: 'AUTO_LAYOUT' }],
    };
  }

  // 3. ⚙️ PARAMETER MUTATION INTENT (Comprehensive Node Field Mutator)
  // 3.1 Training Episodes
  const epPattern = /(?:episode|episodes|รอบเทรน|รอบการเทรน|รอบ|เป้าหมาย|target)[^\d]*([\d,]+)/i;
  const epPatternReverse = /([\d,]+)\s*(?:episode|episodes|รอบ)/i;
  const episodeMatch = query.match(epPattern) || query.match(epPatternReverse);

  if (episodeMatch && (lower.includes('episode') || lower.includes('รอบ') || lower.includes('target') || lower.includes('ep') || lower.includes('ตั้งค่า') || lower.includes('ปรับ') || lower.includes('เปลี่ยน') || lower.includes('เป็น') || lower.includes('set'))) {
    const rawDigits = episodeMatch[1].replace(/,/g, '').trim();
    const epNum = parseInt(rawDigits, 10);
    if (!isNaN(epNum) && epNum > 0) {
      const formatted = epNum >= 1000 ? epNum.toLocaleString('en-US') : String(epNum);
      return {
        replyText: isThai
          ? `อัปเดตเป้าหมายรอบการเทรน (Target Episodes) เป็น **${formatted} รอบ** บน Canvas และแถบสถานะด้านล่างเรียบร้อยแล้วนะคะ`
          : `Updated training target to **${formatted} Episodes** across the canvas architecture.`,
        actions: [
          {
            type: 'UPDATE_PARAM',
            nodeType: 'training_episodes_config',
            paramName: 'target_episodes',
            paramValue: formatted,
          },
        ],
      };
    }
  }

  // 3.2 Dropout Rate
  const dropoutMatch = query.match(/(?:dropout|ดรอปเอาท์|drop)[^\d]*([\d.]+)/i);
  if (dropoutMatch && (lower.includes('dropout') || lower.includes('ดรอปเอาท์'))) {
    const rate = parseFloat(dropoutMatch[1]);
    if (!isNaN(rate) && rate >= 0 && rate <= 1.0) {
      return {
        replyText: isThai
          ? `ปรับ Dropout Rate เป็น **${rate}** บนโหนด Regularization เรียบร้อยแล้วนะคะ`
          : `Updated Spatial Dropout rate to **${rate}**.`,
        actions: [
          {
            type: 'UPDATE_PARAM',
            nodeType: 'spatial_dropout_regularization',
            paramName: 'rate',
            paramValue: rate,
          },
        ],
      };
    }
  }

  // 3.3 Activation Function
  if (lower.includes('mish') || lower.includes('gelu') || lower.includes('leakyrelu') || lower.includes('relu') || lower.includes('tanh')) {
    const actName = lower.includes('mish') ? 'Mish' : lower.includes('gelu') ? 'GELU' : lower.includes('tanh') ? 'Tanh' : lower.includes('relu') && !lower.includes('leaky') ? 'ReLU' : 'LeakyReLU';
    if (lower.includes('activation') || lower.includes('แอกติเวชัน') || lower.includes('เปลี่ยน') || lower.includes('ปรับ') || lower.includes('เป็น')) {
      return {
        replyText: isThai
          ? `ปรับ Activation Function ของโครงข่ายประสาทเทียมเป็น **${actName}** เรียบร้อยแล้วนะคะ`
          : `Switched neural activation function to **${actName}**.`,
        actions: [
          { type: 'UPDATE_PARAM', nodeType: 'fc1_dense_expansion', paramName: 'activation', paramValue: actName },
          { type: 'UPDATE_PARAM', nodeType: 'fc2_bottleneck_synthesizer', paramName: 'activation', paramValue: actName },
        ],
      };
    }
  }

  // 3.4 Attention Heads
  const headsMatch = query.match(/(?:head|heads|หัว)[^\d]*(\d+)/i);
  if (headsMatch && (lower.includes('attention') || lower.includes('head') || lower.includes('ความสนใจ'))) {
    const heads = headsMatch[1];
    return {
      replyText: isThai
        ? `ปรับ Attention Heads เป็น **${heads} หัว** บนโหนด Feature Saliency เรียบร้อยแล้วนะคะ`
        : `Updated Attention Heads to **${heads}**.`,
      actions: [{ type: 'UPDATE_PARAM', nodeType: 'fc1_attention_weights', paramName: 'heads', paramValue: heads }],
    };
  }

  // 3.5 Normalization Type
  if (lower.includes('rmsnorm') || lower.includes('layernorm') || lower.includes('batchnorm')) {
    const norm = lower.includes('rmsnorm') ? 'RMSNorm' : lower.includes('batchnorm') ? 'BatchNorm1D' : 'LayerNorm';
    return {
      replyText: isThai
        ? `ปรับ Normalization Type เป็น **${norm}** เรียบร้อยแล้วนะคะ`
        : `Updated Normalization Type to **${norm}**.`,
      actions: [{ type: 'UPDATE_PARAM', nodeType: 'layer_normalization', paramName: 'norm_type', paramValue: norm }],
    };
  }

  // 3.6 Batch Size
  const batchMatch = query.match(/(?:batch|batch size|แบทช์)[^\d]*(\d+)/i);
  if (batchMatch && (lower.includes('batch') || lower.includes('แบทช์'))) {
    const bSize = batchMatch[1];
    return {
      replyText: isThai
        ? `ปรับ Batch Size เป็น **${bSize}** เรียบร้อยแล้วนะคะ`
        : `Set Batch Size to **${bSize}**.`,
      actions: [{ type: 'UPDATE_PARAM', nodeType: 'training_episodes_config', paramName: 'batch_size', paramValue: bSize }],
    };
  }

  // 3.7 Spread / Friction
  const spreadMatch = query.match(/(?:spread|สเปรด)[^\d]*([\d.]+)/i);
  if (spreadMatch && (lower.includes('spread') || lower.includes('สเปรด'))) {
    const sp = parseFloat(spreadMatch[1]);
    if (!isNaN(sp)) {
      return {
        replyText: isThai
          ? `ปรับ Spread Cost เป็น **${sp} pips** เรียบร้อยแล้วนะคะ`
          : `Set Spread Cost to **${sp} pips**.`,
        actions: [{ type: 'UPDATE_PARAM', nodeType: 'friction_spread_cost', paramName: 'spread_pip', paramValue: sp }],
      };
    }
  }

  // 3.8 Drawdown Limit
  const ddMatch = query.match(/(?:drawdown|dd|ดรอว์ดาวน์|จำกัดขาดทุน)[^\d]*([\d.]+)/i);
  if (ddMatch && (lower.includes('drawdown') || lower.includes('dd') || lower.includes('ดรอว์ดาวน์'))) {
    const dd = parseFloat(ddMatch[1]);
    if (!isNaN(dd)) {
      return {
        replyText: isThai
          ? `ปรับ Max Drawdown Limit เป็น **${dd}%** บนโหนด Drawdown Guard เรียบร้อยแล้วนะคะ`
          : `Set Max Drawdown Guard Limit to **${dd}%**.`,
        actions: [{ type: 'UPDATE_PARAM', nodeType: 'drawdown_guard_penalty', paramName: 'max_dd_limit', paramValue: dd }],
      };
    }
  }

  // Symbol change
  if (lower.includes('eurusd') || lower.includes('btcusd') || lower.includes('xauusd') || lower.includes('gbpusd') || lower.includes('usdjpy')) {
    const newSym = lower.includes('eurusd') ? 'EURUSD' : lower.includes('btcusd') ? 'BTCUSD' : lower.includes('gbpusd') ? 'GBPUSD' : lower.includes('usdjpy') ? 'USDJPY' : 'XAUUSD';
    if (lower.includes('เปลี่ยน') || lower.includes('คู่') || lower.includes('symbol') || lower.includes('set') || lower.includes('ปรับ')) {
      return {
        replyText: isThai
          ? `เปลี่ยนคู่เงินสำหรับโมเดล DRL เป็น **${newSym}** เรียบร้อยแล้วนะคะ`
          : `Switched target asset to **${newSym}**.`,
        actions: [
          { type: 'SET_SYMBOL', symbol: newSym },
          { type: 'UPDATE_PARAM', nodeType: 'strategy_return_window', paramName: 'asset_symbol', paramValue: newSym },
        ],
      };
    }
  }

  // Timeframe change
  if (lower.includes('m1') || lower.includes('m5') || lower.includes('m15') || lower.includes('h1') || lower.includes('h4') || lower.includes('d1')) {
    const newTf = lower.includes('m1 ') || lower.includes('m1$') ? 'M1' : lower.includes('m5') ? 'M5' : lower.includes('h1') ? 'H1' : lower.includes('h4') ? 'H4' : lower.includes('d1') ? 'D1' : 'M15';
    if (lower.includes('เปลี่ยน') || lower.includes('tf') || lower.includes('timeframe') || lower.includes('ไทม์เฟรม') || lower.includes('set') || lower.includes('ปรับ')) {
      return {
        replyText: isThai
          ? `ปรับไทม์เฟรมเป็น **${newTf}** สำหรับการสกัดฟีเจอร์และเทรน DRL เรียบร้อยแล้วนะคะ`
          : `Adjusted analysis timeframe to **${newTf}**.`,
        actions: [
          { type: 'SET_TIMEFRAME', timeframe: newTf },
          { type: 'UPDATE_PARAM', nodeType: 'strategy_return_window', paramName: 'timeframe', paramValue: newTf },
        ],
      };
    }
  }

  // 4. 🚀 STRATEGY GENERATION & BLUEPRINT SYNTHESIS INTENT
  const isStrategyIntent =
    lower.includes('ต่อ') ||
    lower.includes('สร้าง') ||
    lower.includes('กลยุทธ์') ||
    lower.includes('strategy') ||
    lower.includes('blueprint') ||
    lower.includes('วางระบบ') ||
    lower.includes('วาง') ||
    lower.includes('xauusd') ||
    lower.includes('gold') ||
    lower.includes('ทอง') ||
    lower.includes('ppo') ||
    lower.includes('sac') ||
    lower.includes('dqn') ||
    lower.includes('scalp') ||
    lower.includes('breakout') ||
    lower.includes('optimize');

  if (isStrategyIntent) {
    const targetSymbol = lower.includes('eurusd') ? 'EURUSD' : lower.includes('btcusd') ? 'BTCUSD' : currentSymbol;
    const targetTf = lower.includes('h1') ? 'H1' : lower.includes('h4') ? 'H4' : lower.includes('m5') ? 'M5' : currentTimeframe;
    const algoName = lower.includes('sac') ? 'SAC (Soft Actor-Critic)' : lower.includes('dqn') ? 'DQN' : 'Alpha PPO';

    const text = isThai
      ? `จัดโครงสร้างให้ตามคำสั่งเรียบร้อยค่ะ! วิเคราะห์และออกแบบโมเดล **${targetSymbol} ${algoName} (${targetTf})** ให้เรียบร้อยแล้วค่ะ:\n\n* State Space: Lookback 30 + MTF H4 Trend Filter + Volatility (ATR)\n* Neural Topology: 128 Dense (Mish) → Spatial Dropout(0.15) → 64 Dense (GELU) → 3-Action Softmax\n* Reward Engine: Sharpe Ratio Normalization พร้อม Spread Guard & Drawdown Defense\n\nคลิกปุ่มด้านล่างเพื่อเชื่อมต่อ Architecture Pipeline ลงบน Canvas ได้เลยนะคะ`
      : `I have architected a **${targetSymbol} ${targetTf} High-Sharpe ${algoName}** tailored for active market conditions:\n\n* State Space: Returns Lookback + Volatility (ATR) + MTF H4 Trend Filter\n* Neural Topology: 128 Dense (Mish) → Spatial Dropout(0.15) → 64 Dense (GELU) → 3-Action Softmax\n* Reward Engine: Sharpe Ratio / ATR Normalized with Spread Guard & Drawdown Defense\n\nClick the button below to load and wire the architecture pipeline into your Flow Canvas.`;

    const bp = synthesizeBlueprintFromText(query, text, undefined);
    return {
      replyText: text,
      actions: [
        {
          type: 'APPLY_PIPELINE',
          preset: lower.includes('sac') ? 'Mean Reversion (M5)' : lower.includes('breakout') ? 'Breakout Volatility (H1)' : 'Gold Trend Scalper (M15)',
          symbol: targetSymbol,
          timeframe: targetTf,
        },
      ],
      blueprint: bp,
    };
  }

  // 5. 📊 CANVAS STATUS / NODE COUNT INQUIRY
  if (lower.includes('สถานะ') || lower.includes('status') || lower.includes('เช็ค') || lower.includes('check') || lower.includes('มีกี่') || lower.includes('canvas')) {
    return {
      replyText: isThai
        ? `สรุปสถานะ Flow Canvas ปัจจุบันค่ะ:\n\n* จำนวน Node ทั้งหมด: **${baseNodes.length} Nodes**\n* สินทรัพย์ที่กำลังวิเคราะห์: **${currentSymbol}** (${currentTimeframe})\n* โครงสร้างไปป์ไลน์: Feature Extraction → Policy Action Head → Risk Sizer → ONNX Exporter\n* ความพร้อมของระบบ: 100% พร้อมสำหรับการเทรนและ Backtest แล้วค่ะ`
        : `Active Flow Canvas Status:\n\n* Total Nodes: **${baseNodes.length} Nodes**\n* Target Asset: **${currentSymbol}** (${currentTimeframe})\n* Pipeline Health: Nominal and ready for reinforcement learning training.`,
      actions: [],
    };
  }

  // 6. 💬 CASUAL GREETING
  if (lower.includes('สวัสดี') || lower.includes('ได้ยิน') || lower.includes('หวัดดี') || lower.includes('ฮัลโหล') || lower.includes('เทส') || lower.includes('hello') || lower.includes('hi') || lower.includes('test') || lower.includes('สบายดี')) {
    return {
      replyText: isThai
        ? 'สวัสดีค่ะ! ได้ยินชัดเจน 100% เลยค่ะ พร้อมช่วยออกแบบโมเดลและต่อ Node บน Canvas แล้วนะคะ มีอะไรให้น้องช่วยบอกได้เลยค่ะ!'
        : 'Hello! I hear you loud and clear. Ready to help configure your DRL policies and wire DAG nodes. What would you like to build today?',
      actions: [],
    };
  }

  // 7. 🧠 DEFAULT QUANT REASONING RESPONSE
  return {
    replyText: isThai
      ? `รับทราบค่ะ! สำหรับเรื่อง **"${query}"** พร้อมช่วยปรับแต่งสถาปัตยกรรมโครงข่าย DRL และกลยุทธ์ควอนต์ของคุณบนคู่เงิน **${currentSymbol} (${currentTimeframe})** ให้มี Sharpe Ratio สูงสุด สามารถสั่งให้น้องต่อ Node, ปรับค่า Hyperparameters, หรือคำนวณ Reward Function ได้เลยนะคะ!`
      : `Understood! Regarding **"${query}"**, I am standing by to optimize your DRL neural architecture and quant strategy on **${currentSymbol} (${currentTimeframe})** for maximal Sharpe ratio. You can instruct me to assemble nodes, adjust hyperparameters, or formulate reward functions anytime!`,
    actions: [],
  };
};

  // ⚡ Universal Copilot Action Executor
  const executeCopilotActions = (actions: CopilotAction[]): boolean => {
    if (!actions || actions.length === 0) return false;
    let currentN = [...nodes];
    let currentE = [...(edges || [])];
    let hasChanged = false;

    for (const act of actions) {
      if (act.type === 'NEW_PROJECT') {
        // 1. Auto-save current project if it has nodes
        if (currentN.length > 0) {
          try {
            const currentActiveName = architectureSpec?.strategyPreset || 'Previous Project';
            saveCurrentProject(
              {
                name: currentActiveName,
                type: 'Deep RL Policy',
                symbol: architectureSpec?.symbol || 'XAUUSD',
                timeframe: architectureSpec?.timeframe || 'M15',
                description: 'Auto-saved before creating new project',
              },
              currentN,
              currentE,
              architectureSpec
            );
          } catch (_) {}
        }

        // 2. Create new blank project in library
        const newProj = createNewBlankProject(act.projectName);

        // 3. Clear canvas completely for the new project
        currentN = [];
        currentE = [];
        hasChanged = true;

        try {
          localStorage.setItem('fxforge_dag_nodes_v9', JSON.stringify([]));
          localStorage.setItem('fxforge_dag_edges_v9', JSON.stringify([]));
        } catch (_) {}

        // 4. Notify app and canvas
        window.dispatchEvent(
          new CustomEvent('fxforge-new-project', {
            detail: { name: newProj.name, id: newProj.id },
          })
        );
        window.dispatchEvent(
          new CustomEvent('fxforge-load-blueprint', {
            detail: { nodes: [], edges: [], name: newProj.name },
          })
        );
      } else if (act.type === 'CLEAR_CANVAS') {
        currentN = [];
        currentE = [];
        hasChanged = true;
      } else if (act.type === 'ADD_NODE' && act.nodeType) {
        const newNode = createNodeInstance(act.nodeType, act.params || {}, act.position, currentN);
        currentN = [...currentN, newNode];
        hasChanged = true;
      } else if (act.type === 'CONNECT_NODES') {
        let src = act.sourceId;
        let tgt = act.targetId;
        if (!src && act.sourceType) {
          const foundSrc = currentN.find((n) => String(n.data?.nodeType || n.type || '').includes(act.sourceType!));
          if (foundSrc) src = foundSrc.id;
        }
        if (!tgt && act.targetType) {
          const foundTgt = currentN.find((n) => String(n.data?.nodeType || n.type || '').includes(act.targetType!));
          if (foundTgt) tgt = foundTgt.id;
        }
        if (src && tgt && src !== tgt) {
          const edgeId = `e-${src}-${tgt}`;
          if (!currentE.some((e) => e.source === src && e.target === tgt)) {
            currentE = [
              ...currentE,
              {
                id: edgeId,
                source: src,
                target: tgt,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#0a84ff', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.45))' },
              },
            ];
            hasChanged = true;
          }
        }
      } else if (act.type === 'DISCONNECT_NODES') {
        if (act.sourceId && act.targetId) {
          currentE = currentE.filter((e) => !(e.source === act.sourceId && e.target === act.targetId));
          hasChanged = true;
        }
      } else if (act.type === 'AUTO_LAYOUT') {
        currentN = autoLayoutAllNodes(currentN);
        hasChanged = true;
      } else if (act.type === 'DELETE_NODE') {
        if (act.nodeId) {
          currentN = currentN.filter((n) => n.id !== act.nodeId);
          currentE = currentE.filter((e) => e.source !== act.nodeId && e.target !== act.nodeId);
          hasChanged = true;
        } else if (act.nodeType) {
          const target = currentN.find((n) => String(n.data?.nodeType || n.type || '').includes(act.nodeType!));
          if (target) {
            currentN = currentN.filter((n) => n.id !== target.id);
            currentE = currentE.filter((e) => e.source !== target.id && e.target !== target.id);
            hasChanged = true;
          }
        }
      } else if (act.type === 'UPDATE_PARAM' && act.paramName) {
        currentN = currentN.map((n) => {
          if (!act.nodeType || String(n.data?.nodeType || n.type || '').includes(act.nodeType)) {
            hasChanged = true;
            return {
              ...n,
              data: {
                ...n.data,
                [act.paramName!]: act.paramValue,
              },
            };
          }
          return n;
        });
      } else if (act.type === 'APPLY_PIPELINE') {
        const preset = act.preset || 'Gold Trend Scalper (M15)';
        const baseNodes = INITIAL_NODES.map((n) => ({ ...n, data: { ...n.data } }));
        const tuned = autoTunePipelineNodes(preset, baseNodes);
        currentN = tuned;
        currentE = INITIAL_EDGES;
        hasChanged = true;
      } else if (act.type === 'DELETE_ALL_PROJECTS') {
        deleteAllSavedProjects();
      } else if (act.type === 'DELETE_PROJECT') {
        const all = getSavedProjects();
        const target = all.find(
          (p) =>
            (act.projectId && p.id === act.projectId) ||
            (act.projectName && p.name.toLowerCase().includes(act.projectName.toLowerCase())) ||
            (act.projectName && act.projectName.toLowerCase().includes(p.name.toLowerCase()))
        );
        if (target) {
          deleteProject(target.id);
        }
      } else if (act.type === 'START_TRAINING' || act.type === 'RESUME_TRAINING') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-start-training'));
      } else if (act.type === 'PAUSE_TRAINING') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-pause-training'));
      } else if (act.type === 'STOP_TRAINING') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-stop-training'));
      } else if (act.type === 'SAVE_PROJECT') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-save-project', { detail: { name: act.projectName } }));
      } else if (act.type === 'LOAD_PROJECT') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-open-modal', { detail: { modal: 'projects' } }));
      } else if (act.type === 'EXPORT_PROJECT') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-export-project', { detail: { exportType: act.exportType } }));
      } else if (act.type === 'RESET_CAMERA') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-reset-camera'));
      } else if (act.type === 'TOGGLE_THEME') {
        toggleTheme();
      } else if (act.type === 'OPEN_MODAL') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-open-modal', { detail: { modal: act.modalName } }));
      } else if (act.type === 'CLOSE_MODAL') {
        window.dispatchEvent(new CustomEvent('fxforge-ai-close-modal'));
      }
    }

    if (hasChanged) {
      setNodes(currentN);
      setEdges(currentE);
      syncArchitectureToEngine(currentN);
      try {
        localStorage.setItem('fxforge_flow_nodes', JSON.stringify(currentN));
        localStorage.setItem('fxforge_flow_nodes_edges', JSON.stringify(currentE));
      } catch (_) {}
      window.dispatchEvent(
        new CustomEvent('fxforge-update-nodes', {
          detail: { nodes: currentN, edges: currentE },
        })
      );
    }
    return hasChanged;
  };

  const handleSendQuery = async (overrideQuery?: string, _fromVoice: boolean = false) => {
    const query = (overrideQuery || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    const isThai = /[\u0E00-\u0E7F]/.test(query);

    // Build rich real-time canvas summary context for LLM
    const canvasSummary = `[ACTIVE FLOW CANVAS CONTEXT]:
- Total Nodes: ${nodes?.length || 0}
- Active Nodes: ${(nodes || []).map((n: any) => `${n.id}: ${n.data?.label || n.type} (${JSON.stringify(n.data || {})})`).join(' | ')}
- Strategy Preset: ${architectureSpec?.strategyPreset || 'Gold Trend Scalper (M15)'}
- Symbol: ${architectureSpec?.symbol || 'XAUUSD'}
- Timeframe: ${architectureSpec?.timeframe || 'M15'}
- Target Episodes: ${architectureSpec?.totalEpisodes || 5000}
- User Language: ${isThai ? 'Thai' : 'English'}`;

    const aiSettings = getAISettings();
    const hasLiveApi = Boolean((aiSettings.apiKey && aiSettings.apiKey.trim()) || aiSettings.provider === 'ollama');

    // 1. 🚀 LIVE LLM BRAIN (100% PURE REAL AI - Local Engine completely disabled)
    if (hasLiveApi) {
      try {
        const liveAiResult = await callAIModel(
          [
            ...messages.map((m) => ({
              role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
              content: m.text,
            })),
            { role: 'user' as const, content: query },
          ],
          canvasSummary
        );

        if (liveAiResult && liveAiResult.replyText && liveAiResult.replyText.trim()) {
          const cleanResponse = sanitizeFemaleThaiParticles(liveAiResult.replyText);

          // Execute ONLY actions generated by the Real LLM
          if (liveAiResult.actions && liveAiResult.actions.length > 0) {
            executeCopilotActions(liveAiResult.actions);
          }

          // Attach blueprint ONLY if the Real LLM action explicitly requests APPLY_PIPELINE
          let bp: ChatMessage['blueprint'] = undefined;
          const pipelineAction = liveAiResult.actions?.find((a) => a.type === 'APPLY_PIPELINE');
          if (pipelineAction) {
            bp = synthesizeBlueprintFromText(query, cleanResponse, nodes);
          }

          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            sender: 'assistant',
            text: cleanResponse,
            blueprint: bp,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsThinking(false);
          return;
        }
      } catch (err: any) {
        console.error('Live AI API Error:', err);
        const errMsg = isThai
          ? `⚠️ **AI API Error (${aiSettings.model || aiSettings.provider}):**\n\n${err?.message || 'ไม่สามารถติดต่อโมเดล AI ได้'}\n\nกรุณาตรวจสอบ API Key หรือ Endpoint ในหน้าต่าง AI Settings ค่ะ`
          : `⚠️ **AI API Error (${aiSettings.model || aiSettings.provider}):**\n\n${err?.message || 'Failed to communicate with AI endpoint.'}\n\nPlease verify your API Key and model settings in the AI Settings modal.`;

        const errorAiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: errMsg,
        };
        setMessages((prev) => [...prev, errorAiMsg]);
        setIsThinking(false);
        return;
      }
    }

    // 2. ⚙️ OFFLINE LOCAL ENGINE (Used ONLY when user has NOT configured any API Key)
    setTimeout(() => {
      const resolution = resolveSmartQuantIntelligence(
        query,
        nodes,
        edges,
        architectureSpec
      );

      if (resolution.actions && resolution.actions.length > 0) {
        executeCopilotActions(resolution.actions);
      }

      const sanitizedText = sanitizeFemaleThaiParticles(resolution.replyText);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: sanitizedText,
        blueprint: resolution.blueprint,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 320);
  };

  const handleApplyBlueprint = (bp: ChatMessage['blueprint']) => {
    if (!bp) return;
    setAppliedBlueprint(true);
    window.dispatchEvent(
      new CustomEvent('fxforge-load-blueprint', {
        detail: {
          nodes: bp.nodes,
          edges: bp.edges,
          name: bp.name,
          preset: bp.strategyPreset,
        },
      })
    );
    setTimeout(() => setAppliedBlueprint(false), 2800);
  };

  if (!isOpen) return null;

  return (
    <aside
      id="macos-assistant-sidebar"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        bottom: '12px',
        width: isExpanded ? 'calc(100% - 24px)' : '350px',
        maxWidth: 'calc(100% - 24px)',
        zIndex: isExpanded ? 50 : 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 0,
        boxSizing: 'border-box',
        borderRadius: '20px',
        userSelect: 'none',
        overflow: 'visible',
        fontFamily: 'var(--font-apple-text)',
        transition: 'width 0.38s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s ease',
        willChange: 'width',
        boxShadow: isLight
          ? isExpanded
            ? '0 24px 60px rgba(0, 0, 0, 0.16)'
            : '0 20px 40px rgba(0, 0, 0, 0.12)'
          : isExpanded
          ? '0 30px 80px rgba(0, 0, 0, 0.98)'
          : '0 25px 60px rgba(0, 0, 0, 0.95)',
      }}
      className="flex flex-col select-none relative"
    >
      {/*  0. Atmospheric Ambient Glow Halo Layer (Outer Soft Bloom) */}
      <div className="ambient-glow-halo">
        <div className={`ambient-glow-beam ${isSpeaking || isThinking ? 'active-pulsing' : ''}`} />
      </div>

      {/*  0. Crisp Rotating Ambient Border Beam */}
      <div className="ambient-glow-wrapper">
        <div className={`ambient-glow-beam ${isSpeaking || isThinking ? 'active-pulsing' : ''}`} />
      </div>

      {/*  Inner Apple Frosted Glass Surface Container (Glassmorphism, Pure Borderless) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          background: isLight
            ? isExpanded
              ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.88) 0%, rgba(244, 243, 250, 0.82) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.78) 0%, rgba(244, 243, 250, 0.72) 100%)'
            : isExpanded
            ? 'linear-gradient(145deg, rgba(16, 16, 26, 0.82) 0%, rgba(6, 6, 12, 0.90) 100%)'
            : 'linear-gradient(145deg, rgba(14, 14, 22, 0.72) 0%, rgba(4, 4, 8, 0.80) 100%)',
          backdropFilter: 'blur(36px) saturate(190%)',
          WebkitBackdropFilter: 'blur(36px) saturate(190%)',
          border: 'none',
          boxShadow: isLight
            ? '0 20px 50px rgba(0, 0, 0, 0.08)'
            : '0 25px 60px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isExpanded ? '16px 28px' : '14px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'padding 0.3s ease, background 0.3s ease',
        }}
      >
        {/* 1. Header Toolbar */}
        <div
          onDoubleClick={() => setIsExpanded((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '8px',
          flexShrink: 0,
          cursor: 'default',
        }}
      >
        {/* Left: Brand Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RobotAvatar
              size="xs"
              autoEmotion={false}
              showHoverQuestion={false}
              showSpeechBubble={false}
              mood="happy"
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-apple-text)',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '-0.025em',
              }}
              className={isLight ? 'text-[#1d1d1f]' : 'text-white'}
            >
              FXFORGE <span className={isLight ? 'text-[#0071e3]' : 'text-[#007aff]'}>Copilot</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '2px',
                cursor: onOpenSettings ? 'pointer' : 'default',
              }}
              onClick={onOpenSettings}
              title={apiStatus.detail ? `${apiStatus.label}: ${apiStatus.detail}` : apiStatus.label}
            >
              <span
                style={{
                  width: '5.5px',
                  height: '5.5px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor:
                    apiStatus.status === 'ready'
                      ? '#10b981'
                      : apiStatus.status === 'local'
                      ? (isLight ? '#64748b' : '#94a3b8')
                      : '#ef4444',
                  boxShadow:
                    apiStatus.status === 'ready'
                      ? '0 0 6px rgba(16, 185, 129, 0.7)'
                      : apiStatus.status === 'local'
                      ? 'none'
                      : '0 0 6px rgba(239, 68, 68, 0.7)',
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color:
                    apiStatus.status === 'ready'
                      ? '#10b981'
                      : apiStatus.status === 'local'
                      ? (isLight ? '#64748b' : '#94a3b8')
                      : '#ef4444',
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--font-apple-text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {apiStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Maximize, Settings, Clear Chat & Close - Grey in normal, White on hover) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Maximize to Full Canvas / Restore Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              transition: 'color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)';
            }}
            title={isExpanded ? 'Restore Sidebar (ย่อกลับเป็นแถบข้าง)' : 'Expand to Full Canvas (ขยายเต็มหน้า Canvas)'}
          >
            {isExpanded ? <LucideIcons.Minimize2 size={15} /> : <LucideIcons.Maximize2 size={15} />}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                transition: 'color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)';
              }}
              title="AI API Settings"
            >
              <LucideIcons.Settings size={15} />
            </button>
          )}

          <button
            onClick={() => setMessages([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              transition: 'color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)';
            }}
            title="Clear Chat Stream"
          >
            <LucideIcons.RotateCcw size={15} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              transition: 'color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#111827' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)';
            }}
            title="Close Assistant (Ctrl+K)"
          >
            <LucideIcons.X size={16} />
          </button>
        </div>
      </div>

      {/*  2. Center Section: Animated Robot Avatar or Interactive Chat Stream */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflowY: 'auto',
          padding: '8px 0',
          boxSizing: 'border-box',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', margin: 'auto' }}>
            {/* Dynamic Enthusiastic Bouncing Robot Avatar (Eager to answer!) */}
            <RobotAvatar
              size="lg"
              enthusiastic={true}
              showHoverQuestion={false}
              showSpeechBubble={false}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              onClick={() => handleSendQuery('Optimize Gold M15 Strategy')}
            />

            {/* Random Robot Greeting Pure Text (No Frame, No Capsule) */}
            <div
              onClick={() => setGreetingIndex((prev) => (prev + 1) % RANDOM_ROBOT_GREETINGS.length)}
              style={{
                marginTop: '16px',
                padding: '0 16px',
                maxWidth: '280px',
                background: 'transparent',
                border: 'none',
                color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.70)',
                fontSize: '12px',
                lineHeight: 1.55,
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: 'var(--font-apple-text)',
                fontWeight: 400,
                transition: 'color 0.15s ease',
                userSelect: 'none',
                boxShadow: 'none',
              }}
              className={isLight ? 'hover:text-[#0071e3]' : 'hover:text-white'}
              title="Click to cycle greeting"
            >
              {RANDOM_ROBOT_GREETINGS[greetingIndex]}
            </div>
          </div>
        ) : (
          /* Conversation Stream with Frameless Clean Apple Typography */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'center' : 'stretch', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: isExpanded ? '920px' : '100%', display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
              {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.sender === 'user' ? (isExpanded ? '68%' : '85%') : (isExpanded ? '85%' : '94%'),
                  padding:
                    msg.sender === 'user'
                      ? '9px 16px'
                      : '4px 2px',
                  borderRadius: msg.sender === 'user' ? '18px' : '0',
                  fontSize: isExpanded ? '13px' : '12px',
                  lineHeight: msg.sender === 'user' ? '1.55' : '1.62',
                  fontWeight: msg.sender === 'user' ? 500 : 400,
                  boxSizing: 'border-box',
                  background:
                    msg.sender === 'user'
                      ? isLight
                        ? 'rgba(0, 113, 227, 0.08)'
                        : 'rgba(10, 132, 255, 0.12)'
                      : 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  color:
                    msg.sender === 'user'
                      ? isLight
                        ? '#0071e3'
                        : '#60a5fa'
                      : isLight
                      ? '#1d1d1f'
                      : 'rgba(255, 255, 255, 0.92)',
                  fontFamily: 'var(--font-apple-text)',
                  wordBreak: 'break-word',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', fontWeight: msg.sender === 'user' ? 500 : 400 }}>
                  {renderFormattedText(msg.text, isLight)}
                </div>

                {msg.blueprint && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontFamily: 'var(--font-apple-text)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isLight ? '#111827' : 'rgba(255, 255, 255, 0.90)' }}>
                        {msg.blueprint.name}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isLight ? '#0071e3' : '#0a84ff',
                          fontFamily: 'var(--font-apple-numbers)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {msg.blueprint.symbol} · {msg.blueprint.timeframe}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)', lineHeight: 1.45 }}>
                      {msg.blueprint.layersSummary}
                    </div>

                    <button
                      onClick={() => handleApplyBlueprint(msg.blueprint!)}
                      style={{
                        marginTop: '2px',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: appliedBlueprint
                          ? '#30d158'
                          : isLight
                          ? '#0071e3'
                          : '#0a84ff',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '11.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        fontFamily: 'var(--font-apple-text)',
                        transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      {appliedBlueprint ? (
                        <span>Pipeline Applied</span>
                      ) : (
                        <span>Apply Pipeline to Canvas</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
            </div>

            {isThinking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  color: isLight ? '#0071e3' : '#0a84ff',
                  fontWeight: 500,
                  padding: '4px',
                  fontFamily: 'var(--font-apple-text)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-ping" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/*  5. Bottom Apple Frosted Glass Speech & Prompt Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: isExpanded ? '920px' : '100%',
          margin: isExpanded ? '0 auto' : '0',
          height: '48px',
          borderRadius: '16px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box',
          background: isSpeaking
            ? 'rgba(124, 58, 237, 0.28)'
            : isLight
            ? 'rgba(255, 255, 255, 0.72)'
            : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: isSpeaking
            ? '1px solid #a855f7'
            : isLight
            ? '1px solid rgba(255, 255, 255, 0.85)'
            : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isSpeaking
            ? '0 0 20px rgba(168, 85, 247, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : isLight
            ? '0 6px 20px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
            : '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          transition: 'max-width 0.38s cubic-bezier(0.32, 0.72, 0, 1), margin 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (isSpeaking) {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelVoiceListening();
                  return;
                }
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendQuery();
              }
            }}
            placeholder={
              isSpeaking
                ? speechStatus || 'Listening...'
                : 'Type prompt or hold Spacebar to speak'
            }
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              fontWeight: 400,
              color: isLight ? '#000000' : '#ffffff',
              fontFamily: 'var(--font-apple-text)',
            }}
          />
          {/* Animated Cyan Caret */}
          {!inputText && !isSpeaking && (
            <span
              style={{
                width: '2px',
                height: '14px',
                backgroundColor: '#06b6d4',
                marginLeft: '-4px',
                pointerEvents: 'none',
                boxShadow: '0 0 8px #06b6d4',
              }}
              className="animate-pulse"
            />
          )}
        </div>

        {/* Live Audio Volume Decibel Bars */}
        {isSpeaking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginRight: '6px' }}>
            <span
              style={{
                width: '3px',
                height: `${Math.max(6, Math.round(audioLevel * 0.28))}px`,
                backgroundColor: '#a855f7',
                borderRadius: '2px',
                transition: 'height 0.05s ease',
              }}
            />
            <span
              style={{
                width: '3px',
                height: `${Math.max(10, Math.round(audioLevel * 0.4))}px`,
                backgroundColor: '#c084fc',
                borderRadius: '2px',
                transition: 'height 0.05s ease',
              }}
            />
            <span
              style={{
                width: '3px',
                height: `${Math.max(6, Math.round(audioLevel * 0.22))}px`,
                backgroundColor: '#a855f7',
                borderRadius: '2px',
                transition: 'height 0.05s ease',
              }}
            />
          </div>
        )}

        {/* Language Switcher (TH / EN) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVoiceLang((prev) => (prev === 'th-TH' ? 'en-US' : 'th-TH'));
          }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '10px',
            fontWeight: 700,
            color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.45)',
            padding: '2px 4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-apple-numbers)',
            letterSpacing: '0.02em',
            marginRight: '2px',
          }}
          className="hover:text-white"
          title={`Voice Language: ${voiceLang === 'th-TH' ? 'Thai (TH)' : 'English (EN)'} · Click to switch`}
        >
          {voiceLang === 'th-TH' ? 'TH' : 'EN'}
        </button>

        {/* Microphone Button (32x32 Apple Glass Style) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSpeaking) {
              stopVoiceListening(true);
            } else {
              startVoiceListening();
            }
          }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            background: isSpeaking
              ? '#9333ea'
              : isLight
              ? 'rgba(0,0,0,0.06)'
              : '#161622',
            color: isSpeaking ? '#ffffff' : isLight ? '#000000' : '#ffffff',
            boxShadow: isSpeaking
              ? '0 0 16px rgba(168, 85, 247, 0.55)'
              : 'none',
            transition: 'all 0.2s ease',
          }}
          title={
            isSpeaking
              ? 'Listening... Click to stop and send'
              : 'Click or hold Spacebar to speak'
          }
        >
          {isSpeaking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <LucideIcons.Mic size={15} />
          )}
        </button>
      </div>
      </div>
    </aside>
  );
};

export default MacOSAssistantSidebar;
