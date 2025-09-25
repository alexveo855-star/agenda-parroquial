const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';

// 1. Create the 'public' directory if it doesn't exist
if (!fs.existsSync(PUBLIC_DIR)){
    fs.mkdirSync(PUBLIC_DIR);
}

// 2. Create firebase-config.js inside the 'public' folder
let fileContent;
const configJsonString = process.env.FIREBASE_CONFIG;

if (configJsonString) {
  fileContent = `const __firebase_config = '${configJsonString}';`;
  console.log('El archivo public/firebase-config.js fue creado exitosamente desde la variable de entorno.');
} else {
  fileContent = 'const __firebase_config = "{}";';
  console.warn('ADVERTENCIA: La variable de entorno FIREBASE_CONFIG no fue encontrada.');
  console.warn('Se creará un archivo de configuración vacío. La aplicación no funcionará sin esta variable en producción.');
}

fs.writeFileSync(path.join(PUBLIC_DIR, 'firebase-config.js'), fileContent, 'utf8');

// 3. Copy index.html to the 'public' folder
fs.copyFileSync('index.html', path.join(PUBLIC_DIR, 'index.html'));
console.log('index.html fue copiado a /public exitosamente.');

// 4. Copy src/app.js to the 'public' folder
fs.copyFileSync(path.join('src', 'app.js'), path.join(PUBLIC_DIR, 'app.js'));
console.log('src/app.js fue copiado a /public exitosamente.');