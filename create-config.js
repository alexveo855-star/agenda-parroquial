const fs = require('fs');

// Lee el contenido de la variable de entorno
const configContent = process.env.FIREBASE_CONFIG_JS;

// Si la variable no está definida, falla el build con un error claro
if (!configContent) {
  console.error('ERROR: La variable de entorno FIREBASE_CONFIG_JS no fue encontrada.');
  process.exit(1);
}

// Escribe el contenido en el archivo firebase-config.js
fs.writeFileSync('firebase-config.js', configContent, 'utf8');

console.log('El archivo firebase-config.js fue creado exitosamente.');
