// ============================================================
// Concord — Launcher
// Double-click to start! Auto-builds if needed, starts server
// with tunnel, and opens browser.
// ============================================================

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html');

console.log('');
console.log('  ⚡ Concord — Iniciando...');
console.log('  ════════════════════════════════════');
console.log('');

// ── Step 1: Check if node_modules exists ────────────────────
if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
  console.log('  📦 Instalando dependências (primeira vez)...');
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  console.log('');
}

// ── Step 2: Build if dist doesn't exist ─────────────────────
if (!fs.existsSync(DIST_INDEX)) {
  console.log('  🔨 Compilando o frontend...');
  try {
    execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.log('  ⚠️  Build falhou, mas tentando iniciar mesmo assim...');
  }
  console.log('');
}

// ── Step 3: Start server ────────────────────────────────────
console.log('  🚀 Iniciando servidor...');
console.log('');

const serverProc = spawn('node', [path.join(__dirname, 'index.cjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env },
});

// ── Step 4: Open browser after a short delay ────────────────
setTimeout(() => {
  const { exec } = require('child_process');
  const url = `http://localhost:${process.env.PORT || 3001}`;
  // Windows
  exec(`start "" "${url}"`, (err) => {
    if (err) {
      // Fallback for other OS
      exec(`open "${url}" || xdg-open "${url}"`, () => {});
    }
  });
}, 2500);

// ── Cleanup ─────────────────────────────────────────────────
process.on('SIGINT', () => { serverProc.kill(); process.exit(0); });
process.on('SIGTERM', () => { serverProc.kill(); process.exit(0); });
serverProc.on('exit', (code) => process.exit(code ?? 0));
