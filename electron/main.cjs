// ============================================================
// Concord — Electron Main Process
// Wraps the Concord web app as a native desktop application
// ============================================================

const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let serverProcess = null;

const isDev = !app.isPackaged;
const SERVER_PORT = 3001;
const DEV_PORT = 3000;

// ── Create Main Window ──────────────────────────────────────
function createWindow() {
  const iconPath = path.join(__dirname, '..', 'public', 'favicon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    title: 'Concord',
    icon: iconPath,
    backgroundColor: '#020617',
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  // Show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, serve the built files via the Express server
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray on close (optional)
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Create System Tray ──────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'public', 'favicon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Concord',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Concord');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Start Backend Server ────────────────────────────────────
function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.cjs');
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    env: { ...process.env, PORT: String(SERVER_PORT) },
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[Server] exited with code ${code}`);
  });
}

// ── App Lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  // Start the backend server
  startServer();

  // Wait a moment for server to be ready
  setTimeout(() => {
    createWindow();
    createTray();
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    // Don't quit, keep in tray
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});
