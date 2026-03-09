const fs = require('fs');
const path = require('path');

// Script para ajustar el index.html para Electron
const indexPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Asegurar que las rutas sean relativas
  html = html.replace(/href="\//g, 'href="./');
  html = html.replace(/src="\//g, 'src="./');
  
  // Relajar CSP para Electron (permitir file:, blob:, data:, unsafe-inline, unsafe-eval)
  html = html.replace(
    /content="default-src 'self'[^"]*"/,
    'content="default-src \'self\' \'unsafe-inline\' \'unsafe-eval\' file: data: blob: https://api.dicebear.com; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com data:; img-src \'self\' data: blob: file: https://api.dicebear.com https://images.unsplash.com; connect-src \'self\' http://localhost:* ws://localhost:* https://*.supabase.co wss://*.supabase.co;"'
  );
  
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✓ index.html modificado para Electron (rutas relativas + CSP relajado)');
} else {
  console.error('✗ No se encontró dist/index.html');
  process.exit(1);
}
