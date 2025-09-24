const fs = require('fs');

// Lee la configuración de Firebase desde una variable de entorno.
// El contenido de la variable debe ser el objeto de configuración de Firebase en formato JSON string.
const configJsonString = process.env.FIREBASE_CONFIG;

if (!configJsonString) {
  console.error('ERROR: La variable de entorno FIREBASE_CONFIG no fue encontrada.');
  console.error('Asegúrate de configurar esta variable en Vercel con el JSON de tu configuración de Firebase.');
  process.exit(1);
}

// Crea el contenido para el archivo firebase-config.js.
// Esto asigna el string JSON a la variable global __firebase_config.
const fileContent = `const __firebase_config = '${configJsonString}';`;

// Escribe el archivo en la raíz del proyecto.
fs.writeFileSync('firebase-config.js', fileContent, 'utf8');
console.log('El archivo firebase-config.js fue creado exitosamente para el despliegue.');