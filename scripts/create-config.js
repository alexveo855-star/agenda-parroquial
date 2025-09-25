const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';

// 1. Create the 'public' directory if it doesn't exist
if (!fs.existsSync(PUBLIC_DIR)){
    fs.mkdirSync(PUBLIC_DIR);
}

// 2. Create firebase-config.js inside the 'public' folder
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

let fileContent;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const configJsonString = JSON.stringify(firebaseConfig);
  fileContent = `const __firebase_config = '${configJsonString}';`;
  console.log('El archivo public/firebase-config.js fue creado exitosamente desde las variables de entorno.');
} else {
  fileContent = 'const __firebase_config = "{}";';
  console.warn('ADVERTENCIA: No se encontraron todas las variables de entorno de Firebase (se requiere al menos FIREBASE_API_KEY y FIREBASE_PROJECT_ID).');
  console.warn('Se creará un archivo de configuración vacío. La aplicación no funcionará sin estas variables en producción.');
}

fs.writeFileSync(path.join(PUBLIC_DIR, 'firebase-config.js'), fileContent, 'utf8');

// 3. Copy index.html to the 'public' folder
fs.copyFileSync('index.html', path.join(PUBLIC_DIR, 'index.html'));
console.log('index.html fue copiado a /public exitosamente.');

// 4. Copy src/app.js to the 'public' folder
fs.copyFileSync(path.join('src', 'app.js'), path.join(PUBLIC_DIR, 'app.js'));
console.log('src/app.js fue copiado a /public exitosamente.');