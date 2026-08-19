export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'meta'
  | 'qwen'
  | 'mistral'
  | 'grok'
  | 'kimi'
  | 'zhipu'
  | 'openrouter'
  | 'ollama'
  | 'custom';

export interface AIApiSettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export const DEFAULT_AI_SETTINGS: AIApiSettings = {
  provider: 'openrouter',
  apiKey: '',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-r1',
  temperature: 0.3,
  maxTokens: 2048,
  systemPrompt: `You are FXFORGE Quant Copilot, an elite algorithmic trader and Deep Reinforcement Learning (DRL) neural architect.
CRITICAL INSTRUCTIONS:
- You are a female AI persona when speaking Thai: ALWAYS use polite female particles ("ค่ะ", "คะ", "นะคะ") and refer to yourself as "น้อง" or assistant. NEVER use "ครับ" or "ผม".
- CODE FORMATTING & COPY BOX MANDATE: Whenever you provide ANY code (MQL5 EA, Python, ONNX inference script, C++, PineScript, SQL, JSON, etc.), you MUST ALWAYS wrap the code strictly inside Markdown fenced code blocks with the exact language name (e.g. \`\`\`mql5\\n...code...\\n\`\`\` or \`\`\`python\\n...code...\\n\`\`\`). NEVER output code as plain unformatted text.
- Keep answers CONCISE, DIRECT, and NATURAL. Provide brief explanations before or after code blocks without unnecessary clutter.
- For greetings or short casual questions (e.g. "hello", "hi", "สวัสดี", "ได้ยินไหม"), reply in 1 polite, friendly sentence only (e.g. "สวัสดีค่ะ! ได้ยินชัดเจนค่ะ พร้อมช่วยออกแบบโมเดลและต่อ Node แล้วนะคะ").
- Match the user's language: If the user speaks/types Thai, ALWAYS reply in natural, polite Thai (ค่ะ/คะ). If English, reply in concise English.
- Only provide deep architectural breakdowns or node blueprints when explicitly requested by the user.`,
};

export const PROVIDER_PRESETS: Record<
  AIProvider,
  {
    name: string;
    defaultBaseUrl: string;
    models: string[];
    defaultModel: string;
    authHeader: 'bearer' | 'x-api-key' | 'none';
  }
> = {
  openai: {
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
    authHeader: 'bearer',
  },
  anthropic: {
    name: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-7-sonnet', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    authHeader: 'x-api-key',
  },
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
    authHeader: 'bearer',
  },
  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    authHeader: 'bearer',
  },
  meta: {
    name: 'Meta Llama',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'],
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    authHeader: 'bearer',
  },
  qwen: {
    name: 'Alibaba Qwen',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-max', 'qwen2.5-coder-32b-instruct', 'qwen-turbo'],
    defaultModel: 'qwen2.5-coder-32b-instruct',
    authHeader: 'bearer',
  },
  mistral: {
    name: 'Mistral AI',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'codestral-latest', 'pixtral-large-latest', 'mistral-small-latest'],
    defaultModel: 'codestral-latest',
    authHeader: 'bearer',
  },
  grok: {
    name: 'xAI (Grok)',
    defaultBaseUrl: 'https://api.x.ai/v1',
    models: ['grok-2-latest', 'grok-beta', 'grok-2-vision-latest'],
    defaultModel: 'grok-2-latest',
    authHeader: 'bearer',
  },
  kimi: {
    name: 'Moonshot Kimi',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    defaultModel: 'moonshot-v1-32k',
    authHeader: 'bearer',
  },
  zhipu: {
    name: 'Z.AI (Zhipu GLM)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4-air', 'glm-4-flash', 'codegeex-4'],
    defaultModel: 'glm-4-flash',
    authHeader: 'bearer',
  },
  openrouter: {
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'qwen/qwen-2.5-coder-32b-instruct',
    ],
    defaultModel: 'deepseek/deepseek-r1',
    authHeader: 'bearer',
  },
  ollama: {
    name: 'Ollama (Local)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: ['llama3.3:70b', 'llama3.1:8b', 'qwen2.5-coder:32b', 'deepseek-r1:8b', 'mistral:7b', 'custom'],
    defaultModel: 'llama3.3:70b',
    authHeader: 'none',
  },
  custom: {
    name: 'Custom OpenAI API',
    defaultBaseUrl: 'https://api.your-endpoint.com/v1',
    models: ['default', 'custom-model'],
    defaultModel: 'default',
    authHeader: 'bearer',
  },
};

const STORAGE_KEY = 'fxforge_ai_api_settings';

export function getAISettings(): AIApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AIApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save AI settings to localStorage', err);
  }
}

export async function testAIConnection(
  settings: AIApiSettings
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();

  // 1. Client-Side Validation: Ensure API Key is provided (except for local Ollama)
  if (settings.provider !== 'ollama' && (!settings.apiKey || !settings.apiKey.trim())) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Please paste your API Key into the "API Secret Key" field first.',
    };
  }

  try {
    const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fxforge.quant.ai',
      'X-Title': 'FXFORGE Quant Copilot',
    };

    const trimmedKey = settings.apiKey ? settings.apiKey.trim() : '';

    if (trimmedKey) {
      if (settings.provider === 'anthropic') {
        headers['x-api-key'] = trimmedKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${trimmedKey}`;
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Ping: reply with 1 word OK' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      let parsedMessage = '';
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.error?.message || json.message || errText;
      } catch {
        parsedMessage = errText;
      }

      return {
        success: false,
        latencyMs,
        message: `HTTP ${res.status}: ${parsedMessage.slice(0, 120)}`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Connection successful (${latencyMs}ms)`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: err?.message || 'Network error: could not connect to endpoint',
    };
  }
}

export function sanitizeFemaleThaiParticles(text: string): string {
  if (!text) return text;
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/ครับผม/g, 'ค่ะ')
    .replace(/นะครับ/g, 'นะคะ')
    .replace(/ล่ะครับ/g, 'ล่ะคะ')
    .replace(/ไหมครับ/g, 'ไหมคะ')
    .replace(/มั้ยครับ/g, 'มั้ยคะ')
    .replace(/หรือครับ/g, 'หรือคะ')
    .replace(/ด้วยครับ/g, 'ด้วยค่ะ')
    .replace(/นะคับ/g, 'นะคะ')
    .replace(/คับ/g, 'ค่ะ')
    .replace(/ครับ/g, 'ค่ะ')
    .replace(/ผมขอ/g, 'น้องขอ')
    .replace(/ผมจะ/g, 'น้องจะ')
    .replace(/ผมได้/g, 'น้องได้')
    .replace(/ผมพร้อม/g, 'น้องพร้อม')
    .replace(/\bผม\b/g, 'น้อง')
    .replace(/กระผม/g, 'น้อง');
}

export interface CopilotAction {
  type:
    | 'START_TRAINING'
    | 'PAUSE_TRAINING'
    | 'STOP_TRAINING'
    | 'RESUME_TRAINING'
    | 'SAVE_PROJECT'
    | 'LOAD_PROJECT'
    | 'EXPORT_PROJECT'
    | 'NEW_PROJECT'
    | 'DELETE_ALL_PROJECTS'
    | 'DELETE_PROJECT'
    | 'CLEAR_CANVAS'
    | 'ADD_NODE'
    | 'DELETE_NODE'
    | 'DUPLICATE_NODE'
    | 'CONNECT_NODES'
    | 'DISCONNECT_NODES'
    | 'UPDATE_PARAM'
    | 'AUTO_LAYOUT'
    | 'APPLY_PIPELINE'
    | 'SET_SYMBOL'
    | 'SET_TIMEFRAME'
    | 'RESET_CAMERA'
    | 'TOGGLE_THEME'
    | 'OPEN_MODAL'
    | 'CLOSE_MODAL';
  nodeType?: string;
  nodeId?: string;
  sourceId?: string;
  targetId?: string;
  sourceType?: string;
  targetType?: string;
  position?: { x: number; y: number };
  params?: Record<string, any>;
  paramName?: string;
  paramValue?: any;
  preset?: string;
  symbol?: string;
  timeframe?: string;
  projectName?: string;
  projectId?: string;
  exportType?: 'json' | 'onnx' | 'mql5';
  modalName?: 'deploy' | 'projects' | 'settings';
  themeMode?: 'light' | 'dark';
}

export interface CopilotLLMResult {
  replyText: string;
  actions: CopilotAction[];
}

export async function callAIModel(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  canvasContext?: string
): Promise<CopilotLLMResult> {
  const settings = getAISettings();

  // If no API key is provided and not using local Ollama, fallback to built-in quant engine
  if (!settings.apiKey && settings.provider !== 'ollama') {
    return { replyText: '', actions: [] };
  }

  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://fxforge.quant.ai',
    'X-Title': 'FXFORGE Quant Copilot',
  };

  const trimmedKey = settings.apiKey ? settings.apiKey.trim() : '';
  if (trimmedKey) {
    if (settings.provider === 'anthropic') {
      headers['x-api-key'] = trimmedKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${trimmedKey}`;
    }
  }

  const systemMsg = `You are FXFORGE Quant Copilot, an elite institutional Deep Reinforcement Learning (DRL) quant expert and neural architect with FULL SYSTEM CONTROL PERMISSIONS.

CRITICAL RULES:
1. When speaking Thai, ALWAYS be a polite female persona: Use particles "ค่ะ", "คะ", "นะคะ" and refer to yourself as "น้อง". NEVER use "ครับ" or "ผม".
2. Match user language: Thai -> natural polite Thai. English -> concise English.
4. CODE FORMATTING & COPY BOX MANDATE: Whenever you provide ANY code (MQL5 EA, Python, ONNX inference script, C++, PineScript, SQL, JSON, etc.), you MUST ALWAYS wrap the code strictly inside Markdown fenced code blocks with the exact language name. NEVER output code as plain unformatted text paragraphs. Always organize code in its own dedicated copyable code box.

FULL SYSTEM PERMISSION ACTION PROTOCOL:
You have FULL ROOT PERMISSION to control every feature of the FXFORGE platform. Whenever the user requests any operation (Canvas edits, Parameter updates, Strategy generation, Starting/Pausing/Stopping training, Saving/Loading/Exporting projects, Opening deployment modals, Resetting camera, or Switching theme), append a JSON action block at the VERY END of your response in this exact format:
\`\`\`json
{
  "actions": [
    { "type": "START_TRAINING" },
    { "type": "PAUSE_TRAINING" },
    { "type": "STOP_TRAINING" },
    { "type": "SAVE_PROJECT", "projectName": "My Strategy" },
    { "type": "LOAD_PROJECT", "projectName": "Gold Scalper" },
    { "type": "EXPORT_PROJECT", "exportType": "json" },
    { "type": "NEW_PROJECT", "projectName": "AABBB" },
    { "type": "CLEAR_CANVAS" },
    { "type": "DELETE_NODE", "nodeType": "news_impact_filter" },
    { "type": "UPDATE_PARAM", "nodeType": "training_episodes_config", "paramName": "target_episodes", "paramValue": "5,000" },
    { "type": "APPLY_PIPELINE", "preset": "Gold Trend Scalper (M15)", "symbol": "XAUUSD", "timeframe": "M15" },
    { "type": "SET_SYMBOL", "symbol": "XAUUSD" },
    { "type": "SET_TIMEFRAME", "timeframe": "M15" },
    { "type": "RESET_CAMERA" },
    { "type": "OPEN_MODAL", "modalName": "deploy" }
  ]
}
\`\`\`

IMPORTANT RULES FOR ACTIONS:
- If the user only asks to create a new project (e.g. "สร้าง Project ใหม่", "new project", "สร้างโปรเจกต์ AABBB"), include ONLY \`{ "type": "NEW_PROJECT", "projectName": "<name>" }\`. Do NOT include \`APPLY_PIPELINE\` unless the user explicitly asks to build or generate a node pipeline as well.
- If the user asks a conversational or theoretical question without needing a canvas/system action, do NOT include any JSON block.

${settings.systemPrompt}

${canvasContext ? `[ACTIVE FLOW CANVAS CURRENT REAL-TIME CONTEXT]:\n${canvasContext}` : ''}`;

  const payload = {
    model: settings.model,
    messages: [{ role: 'system', content: systemMsg }, ...messages],
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    let errorMsg = err;
    try {
      const json = JSON.parse(err);
      errorMsg = json.error?.message || json.message || err;
    } catch {
      // keep raw string
    }
    throw new Error(`AI API Error (${response.status}): ${errorMsg.slice(0, 160)}`);
  }

  const data = await response.json();
  const rawResponse = data.choices?.[0]?.message?.content || '';

  // Extract JSON actions if present
  let replyText = rawResponse;
  const actions: CopilotAction[] = [];

  const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?"actions"[\s\S]*?\})\s*```/i) ||
                    rawResponse.match(/(\{[\s\S]*?"actions"\s*:\s*\[[\s\S]*?\]\s*\})/i);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed.actions)) {
        actions.push(...parsed.actions);
      }
      replyText = rawResponse.replace(jsonMatch[0], '').trim();
    } catch (e) {
      console.warn('Failed to parse AI action JSON:', e);
    }
  }

  return {
    replyText: sanitizeFemaleThaiParticles(replyText),
    actions,
  };
}

export interface VoiceSettings {
  autoSpeak: boolean;
  voiceURI: string;
  rate: number;
  pitch: number;
  whisperEnabled: boolean;
  whisperApiKey: string;
  whisperProvider: 'groq' | 'openai';
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  autoSpeak: true,
  voiceURI: 'thai-cloud-neural',
  rate: 1.05,
  pitch: 1.0,
  whisperEnabled: false,
  whisperApiKey: '',
  whisperProvider: 'groq',
};

export const getVoiceSettings = (): VoiceSettings => {
  try {
    const raw = localStorage.getItem('fxforge_voice_settings');
    if (raw) return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch (_) {}
  return DEFAULT_VOICE_SETTINGS;
};

export const saveVoiceSettings = (settings: VoiceSettings): void => {
  localStorage.setItem('fxforge_voice_settings', JSON.stringify(settings));
};

// 🔊 Universal Speech Synthesis Engine: Thai Quant Pro (Thai Female) & Microsoft Zira (English Female)
let globalAudioInstance: HTMLAudioElement | null = null;

const MALE_VOICE_REGEX = /niwat|pattara|david|mark|george|james|richard|guy|male|boy|man|stefan|paul|brian|eric/i;

export const stopUniversalTTS = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  if (globalAudioInstance) {
    try {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
    } catch (_) {}
    globalAudioInstance = null;
  }
};

export const playUniversalTTS = (
  text: string,
  options?: { onStart?: () => void; onEnd?: () => void }
): void => {
  try {
    const isThai = /[\u0E00-\u0E7F]/.test(text) || getVoiceSettings().voiceURI.includes('thai');
    const clean = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#/g, '')
      .replace(/✓/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/📊|🧠|🛡️|🗣️|✨|💰|📦|📐/g, '')
      .trim();

    if (!clean) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    // Stop any ongoing native speech or audio stream immediately
    stopUniversalTTS();

    if (options?.onStart) {
      options.onStart();
    }

    // 1. 🇹🇭 Thai Speech: Always stream Thai Quant Pro (Female)
    if (isThai) {
      const fallbackToNativeThai = () => {
        globalAudioInstance = null;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const voices = window.speechSynthesis.getVoices();
          // Strictly pick female Thai voice; blacklist male voices (e.g. Niwat / Pattara)
          const thaiFemaleVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith('th') && (v.name.toLowerCase().includes('premwadee') || v.name.toLowerCase().includes('achara') || v.name.toLowerCase().includes('kanya') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google'))) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('th') && !MALE_VOICE_REGEX.test(v.name)) ||
            voices.find((v) => (v.name.toLowerCase().includes('thai') || v.name.toLowerCase().includes('th')) && !MALE_VOICE_REGEX.test(v.name));

          // If no Thai female voice exists on Windows, fallback to Zira (English female) to prevent David (male)
          const safeFemaleVoice =
            thaiFemaleVoice ||
            voices.find((v) => v.name.toLowerCase().includes('zira')) ||
            voices.find((v) => v.name.toLowerCase().includes('jenny')) ||
            voices.find((v) => v.name.toLowerCase().includes('aria')) ||
            voices.find((v) => v.name.toLowerCase().includes('samantha')) ||
            voices.find((v) => v.name.toLowerCase().includes('karen')) ||
            voices.find((v) => v.lang.startsWith('en') && !MALE_VOICE_REGEX.test(v.name));

          const utterance = new SpeechSynthesisUtterance(clean);
          if (safeFemaleVoice) {
            utterance.voice = safeFemaleVoice;
            utterance.lang = safeFemaleVoice.lang;
          }
          utterance.rate = 1.15;
          utterance.pitch = 1.20; // Bright, feminine pitch
          utterance.onstart = () => options?.onStart?.();
          utterance.onend = () => options?.onEnd?.();
          utterance.onerror = () => options?.onEnd?.();
          window.speechSynthesis.speak(utterance);
        } else if (options?.onEnd) {
          options.onEnd();
        }
      };

      const audioUrl = `/api/tts?text=${encodeURIComponent(clean)}&lang=th`;
      const audio = new Audio(audioUrl);
      globalAudioInstance = audio;
      audio.playbackRate = 1.28; // Thai Quant Pro crisp natural rate

      audio.onplay = () => {
        options?.onStart?.();
      };
      audio.onended = () => {
        globalAudioInstance = null;
        if (options?.onEnd) options.onEnd();
      };
      audio.onerror = () => {
        fallbackToNativeThai();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio stream error, falling back to native female speech:', err);
          fallbackToNativeThai();
        });
      }
      return;
    }

    // 2. 🇺🇸 English Speech: Always stream high-definition English Female Voice via /api/tts
    const fallbackToNativeEnglish = () => {
      globalAudioInstance = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const femaleEnglishVoice =
          voices.find((v) => v.name.toLowerCase().includes('zira')) ||
          voices.find((v) => v.name.toLowerCase().includes('jenny')) ||
          voices.find((v) => v.name.toLowerCase().includes('aria')) ||
          voices.find((v) => v.name.toLowerCase().includes('samantha')) ||
          voices.find((v) => v.name.toLowerCase().includes('karen')) ||
          voices.find((v) => v.name.toLowerCase().includes('victoria')) ||
          voices.find((v) => v.name.toLowerCase().includes('catherine')) ||
          voices.find((v) => v.name.toLowerCase().includes('susan')) ||
          voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
          voices.find((v) => v.lang.startsWith('en') && !MALE_VOICE_REGEX.test(v.name));

        const utterance = new SpeechSynthesisUtterance(clean);
        if (femaleEnglishVoice) {
          utterance.voice = femaleEnglishVoice;
          utterance.lang = femaleEnglishVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = 1.05;
        utterance.pitch = 1.25; // Feminine pitch (strictly avoid male tone)

        utterance.onstart = () => options?.onStart?.();
        utterance.onend = () => options?.onEnd?.();
        utterance.onerror = () => options?.onEnd?.();
        window.speechSynthesis.speak(utterance);
      } else if (options?.onEnd) {
        options.onEnd();
      }
    };

    const audioUrl = `/api/tts?text=${encodeURIComponent(clean)}&lang=en`;
    const audio = new Audio(audioUrl);
    globalAudioInstance = audio;
    audio.playbackRate = 1.15;

    audio.onplay = () => {
      options?.onStart?.();
    };
    audio.onended = () => {
      globalAudioInstance = null;
      if (options?.onEnd) options.onEnd();
    };
    audio.onerror = () => {
      fallbackToNativeEnglish();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('English audio stream error, falling back to native female speech:', err);
        fallbackToNativeEnglish();
      });
    }
  } catch (err) {
    console.warn('TTS playback error:', err);
    if (options?.onEnd) options.onEnd();
  }
};

