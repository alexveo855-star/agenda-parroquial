const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';

// 1. Crear el directorio 'public' si no existe
if (!fs.existsSync(PUBLIC_DIR)){
    fs.mkdirSync(PUBLIC_DIR);
}

// 2. Crear firebase-config.js dentro de la carpeta 'public'
const configJsonString = process.env.FIREBASE_CONFIG;
if (!configJsonString) {
  console.error('ERROR: La variable de entorno FIREBASE_CONFIG no fue encontrada.');
  process.exit(1);
}
const fileContent = `const __firebase_config = '${configJsonString}';`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'firebase-config.js'), fileContent, 'utf8');
console.log('El archivo public/firebase-config.js fue creado exitosamente.');

// 3. Copiar index.html a la carpeta 'public'
fs.copyFileSync('index.html', path.join(PUBLIC_DIR, 'index.html'));
console.log('index.html fue copiado a /public exitosamente.');

// 4. Copiar src/app.js a la carpeta 'public'
fs.copyFileSync(path.join('src', 'app.js'), path.join(PUBLIC_DIR, 'app.js'));
console.log('src/app.js fue copiado a /public exitosamente.');
