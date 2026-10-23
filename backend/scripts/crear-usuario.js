// =====================================================================
// Script de línea de comandos para dar de alta un usuario.
// A propósito NO existe un endpoint público de registro: con 2 usuarios
// fijos (los emprendedores), lo seguro es crearlos a mano, una vez,
// corriendo esto desde una terminal con acceso a la base de datos.
//
// Uso:
//   node scripts/crear-usuario.js "Nombre Apellido" email@ejemplo.com
//
// Pide la contraseña de forma oculta (no queda en el historial de la
// terminal ni en los logs del proceso).
// =====================================================================
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const usuariosRepo = require('../src/repositories/usuarios.repository');

const SALT_ROUNDS = 12;

function leerPasswordOculta(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const outputOriginal = rl._writeToOutput;
    rl._writeToOutput = (str) => {
      // Oculta lo que se escribe, salvo la pregunta misma y el salto de línea
      if (str.includes(pregunta) || str.trim() === '') rl.output.write(str);
      else rl.output.write('*');
    };
    rl.question(pregunta, (respuesta) => {
      rl._writeToOutput = outputOriginal;
      rl.history = rl.history.slice(1); // no dejar la contraseña en el historial de readline
      rl.close();
      console.log('');
      resolve(respuesta);
    });
  });
}

async function main() {
  const [, , nombre, email] = process.argv;

  if (!nombre || !email) {
    console.error('Uso: node scripts/crear-usuario.js "Nombre Apellido" email@ejemplo.com');
    process.exit(1);
  }

  const password = await leerPasswordOculta('Contraseña (no se muestra en pantalla): ');
  if (!password || password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }
  const confirmacion = await leerPasswordOculta('Repetí la contraseña: ');
  if (password !== confirmacion) {
    console.error('Las contraseñas no coinciden.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const usuario = await usuariosRepo.crear({ nombre, email, passwordHash });

  console.log(`Usuario creado: ${usuario.nombre} <${usuario.email}> (id ${usuario.id})`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error creando el usuario:', err.message);
  process.exit(1);
});
