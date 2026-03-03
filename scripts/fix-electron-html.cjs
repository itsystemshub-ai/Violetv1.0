const fs = require('fs');
const path = require('path');

// Leer el archivo index.html
const indexPath = path.join(__dirname, '../dist/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Remover la política CSP que causa problemas en Electron
html = html.replace(
  /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi,
  '<!-- CSP removed for Electron -->'
);

// Escribir el archivo modificado
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✓ index.html modificado para Electron');
