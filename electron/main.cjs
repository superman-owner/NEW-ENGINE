const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;
let pythonProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#040407',
    title: 'FXForge Lab - AI Deep RL BPNN Quant Studio',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
}

// =========================================================================
// ELECTRON IPC HANDLERS FOR REAL PYTORCH RL TRAINING
// =========================================================================
ipcMain.handle('start-real-training', async (event, config) => {
  if (pythonProcess) {
    return { success: false, message: 'Training is already running.' };
  }

  try {
    const configPath = path.join(__dirname, '../pipeline_config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const scriptPath = path.join(__dirname, '../train_fxforge_rl.py');
    pythonProcess = spawn('python', [scriptPath, '--config', configPath], {
      cwd: path.join(__dirname, '..'),
      env: process.env,
    });

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (mainWindow) {
        mainWindow.webContents.send('training-stdout', text);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (mainWindow) {
        mainWindow.webContents.send('training-stderr', text);
      }
    });

    pythonProcess.on('close', (code) => {
      pythonProcess = null;
      if (mainWindow) {
        mainWindow.webContents.send('training-finished', { code });
      }
    });

    return { success: true, message: 'Real PyTorch RL Training Started' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('stop-real-training', async () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    return { success: true, message: 'Training process killed' };
  }
  return { success: false, message: 'No training process running' };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
