// Creates a desktop shortcut for Concord
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const batPath = path.join(__dirname, '..', 'Concord.bat');
const desktop = path.join(os.homedir(), 'Desktop');
const shortcutPath = path.join(desktop, 'Concord.lnk');

// Use PowerShell to create a proper Windows shortcut
const ps = `
$ws = New-Object -ComObject WScript.Shell;
$s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}');
$s.TargetPath = '${batPath.replace(/'/g, "''")}';
$s.WorkingDirectory = '${path.dirname(batPath).replace(/'/g, "''")}';
$s.Description = 'Concord - Discord + Trello + Notion em Tempo Real';
$s.IconLocation = 'imageres.dll,2';
$s.WindowStyle = 7;
$s.Save();
`;

try {
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
    stdio: 'pipe',
  });
  console.log('');
  console.log('  ✅ Atalho criado na Área de Trabalho!');
  console.log(`     ${shortcutPath}`);
  console.log('');
  console.log('  Agora basta dar duplo clique em "Concord"');
  console.log('  no desktop para iniciar tudo automaticamente!');
  console.log('');
} catch (err) {
  console.error('  ❌ Erro ao criar atalho:', err.message);
  console.log('');
  console.log('  💡 Alternativa: Crie um atalho manual para:');
  console.log(`     ${batPath}`);
  console.log('');
}
