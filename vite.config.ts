import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let pythonProc: any = null;
const eventClients = new Set<any>();

function pythonTrainingPlugin() {
  return {
    name: 'python-training-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // 1. SSE Stream for Real-time Progress & Logs
        if (url === '/api/train/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write('data: {"type":"connected"}\n\n');
          eventClients.add(res);

          req.on('close', () => {
            eventClients.delete(res);
          });
          return;
        }

        // 2. Start Real Python PyTorch Training
        if (url === '/api/train/start' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const config = JSON.parse(body || '{}');
              const configPath = path.join(process.cwd(), 'pipeline_config.json');
              fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

              if (pythonProc) {
                try {
                  pythonProc.kill();
                } catch (e) {}
                pythonProc = null;
              }

              const scriptPath = path.join(process.cwd(), 'train_fxforge_rl.py');
              pythonProc = spawn('python', ['-u', scriptPath, '--config', configPath], {
                cwd: process.cwd(),
                env: process.env,
              });

              pythonProc.stdout.on('data', (data: any) => {
                const text = data.toString();
                const payload = JSON.stringify({ type: 'stdout', text });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              pythonProc.stderr.on('data', (data: any) => {
                const text = data.toString();
                const payload = JSON.stringify({ type: 'stderr', text });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              pythonProc.on('close', (code: any) => {
                pythonProc = null;
                const payload = JSON.stringify({ type: 'finished', code });
                for (const client of eventClients) {
                  client.write(`data: ${payload}\n\n`);
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'PyTorch RL Training process launched' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 3. Stop Real Training
        if (url === '/api/train/stop' && req.method === 'POST') {
          if (pythonProc) {
            try {
              pythonProc.kill();
            } catch (e) {}
            pythonProc = null;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Training process stopped' }));
          return;
        }

        // 4. Status Check
        if (url === '/api/train/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ running: Boolean(pythonProc) }));
          return;
        }

        // 5. 🔊 Universal High-Definition Neural TTS Audio Stream (Multi-Chunk Concat, Zero-CORS, 100% Reliable Thai Female Speech)
        if (url === '/api/tts' && req.method === 'GET') {
          try {
            const parsed = new URL(req.url || '', `http://${req.headers.host || 'localhost:5173'}`);
            const rawText = parsed.searchParams.get('text') || 'สวัสดีค่ะ';
            const lang = parsed.searchParams.get('lang') || 'th';

            // Split into safe chunks of max 120 chars each so Google never returns 400 Bad Request
            const chunks: string[] = [];
            const sentences = rawText.split(/[\n,;。！？\.\!\?]+/g).map((s: string) => s.trim()).filter(Boolean);
            let currentChunk = '';

            for (const s of (sentences.length > 0 ? sentences : [rawText])) {
              if ((currentChunk + ' ' + s).length <= 120) {
                currentChunk = currentChunk ? currentChunk + ' ' + s : s;
              } else {
                if (currentChunk) chunks.push(currentChunk);
                if (s.length <= 120) {
                  currentChunk = s;
                } else {
                  for (let i = 0; i < s.length; i += 120) {
                    chunks.push(s.slice(i, i + 120));
                  }
                  currentChunk = '';
                }
              }
            }
            if (currentChunk) chunks.push(currentChunk);
            if (chunks.length === 0) chunks.push('สวัสดีค่ะ');

            // Limit total speech to first 6 chunks to keep responses snappy
            const targetChunks = chunks.slice(0, 6);

            const https = require('https');
            const fetchAudioChunk = (chunkText: string): Promise<Buffer> => {
              return new Promise((resolve) => {
                const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
                  lang
                )}&q=${encodeURIComponent(chunkText)}`;

                const gReq = https.get(
                  targetUrl,
                  {
                    headers: {
                      'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                      Accept: '*/*',
                    },
                  },
                  (gRes: any) => {
                    if (gRes.statusCode !== 200) {
                      resolve(Buffer.alloc(0));
                      return;
                    }
                    const data: Buffer[] = [];
                    gRes.on('data', (c: Buffer) => data.push(c));
                    gRes.on('end', () => resolve(Buffer.concat(data)));
                  }
                );
                gReq.on('error', () => resolve(Buffer.alloc(0)));
              });
            };

            Promise.all(targetChunks.map((c) => fetchAudioChunk(c)))
              .then((buffers) => {
                if (res.writableEnded || res.destroyed) return;
                const finalBuffer = Buffer.concat(buffers);
                if (finalBuffer.length === 0) {
                  if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('TTS Empty Buffer');
                  }
                  return;
                }

                if (!res.headersSent) {
                  res.writeHead(200, {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': finalBuffer.length,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600',
                  });
                }
                res.end(finalBuffer);
              })
              .catch((err) => {
                if (!res.headersSent && !res.writableEnded) {
                  res.writeHead(500, { 'Content-Type': 'text/plain' });
                  res.end(err?.message || 'TTS Concat Error');
                }
              });
          } catch (e: any) {
            if (!res.headersSent && !res.writableEnded) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end(e?.message || 'TTS Internal Error');
            }
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  server: {
    watch: {
      ignored: [
        '**/pipeline_config.json',
        '**/rl_trading_model.onnx',
        '**/*.log',
        '**/*.onnx',
        '**/diagnose_*.mjs',
        '**/test_*.mjs',
        '**/.git/**',
        '**/dist/**',
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    pythonTrainingPlugin(),
  ],
});

