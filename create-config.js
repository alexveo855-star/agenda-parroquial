const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';

// 1. Crear el directorio 'public' si no existe
if (!fs.existsSync(PUBLIC_DIR)){
    fs.mkdirSync(PUBLIC_DIR);
}

// 2. Crear firebase-config.js dentro de la carpeta 'public'
const configContent = process.env.FIREBASE_CONFIG_JS;
if (!configContent) {
  console.error('ERROR: La variable de entorno FIREBASE_CONFIG_JS no fue encontrada.');
  process.exit(1);
}
fs.writeFileSync(path.join(PUBLIC_DIR, 'firebase-config.js'), configContent, 'utf8');
console.log('El archivo public/firebase-config.js fue creado exitosamente.');

// 3. Copiar agenda.html a la carpeta 'public'
fs.copyFileSync('agenda.html', path.join(PUBLIC_DIR, 'agenda.html'));
console.log('agenda.html fue copiado a /public exitosamente.');
