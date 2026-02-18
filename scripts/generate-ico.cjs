// Generate ICO from PNG by embedding it directly
// ICO format supports PNG embedding for 256x256 icons
const fs = require('fs');
const path = require('path');

const pngData = fs.readFileSync(path.join(__dirname, '..', 'public', 'favicon.png'));

// ICO header: 6 bytes
// ICONDIR: { reserved: 0, type: 1 (icon), count: 1 }
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(1, 4); // count = 1

// ICONDIRENTRY: 16 bytes
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);   // width: 0 means 256
entry.writeUInt8(0, 1);   // height: 0 means 256
entry.writeUInt8(0, 2);   // color palette: 0
entry.writeUInt8(0, 3);   // reserved
entry.writeUInt16LE(1, 4);  // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(pngData.length, 8); // size of PNG data
entry.writeUInt32LE(6 + 16, 12); // offset (header + 1 entry)

const ico = Buffer.concat([header, entry, pngData]);

const outDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'icon.ico');
fs.writeFileSync(outPath, ico);
console.log(`✅ icon.ico created (${ico.length} bytes) at ${outPath}`);
