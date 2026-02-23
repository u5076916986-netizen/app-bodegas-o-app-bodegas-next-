// =============================================================================
// Script: Seed de Usuarios de Prueba
// =============================================================================
// Este script crea usuarios de prueba para cada rol en la base de datos.
// 
// CÓMO EJECUTAR:
//   npx tsx scripts/seed-usuarios.ts
// 
// IMPORTANTE: Ejecuta primero la migración de Prisma si no lo has hecho:
//   npx prisma migrate dev --name agregar_autenticacion
// =============================================================================

import { PrismaClient, Rol } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// Contraseña por defecto para todos los usuarios de prueba
const PASSWORD_DEFAULT = 'password123';

// Usuarios de prueba a crear
const usuariosPrueba = [
  {
    email: 'admin@bodegas.com',
    nombre: 'Administrador',
    rol: 'ADMIN' as Rol,
    bodegaId: null,
  },
  {
    email: 'bodeguero@bodegas.com',
    nombre: 'Juan Bodeguero',
    rol: 'BODEGUERO' as Rol,
    bodegaId: 'BOD_006', // Asignar a una bodega existente
  },
  {
    email: 'cliente@bodegas.com',
    nombre: 'María Cliente',
    rol: 'CLIENTE' as Rol,
    bodegaId: null,
  },
];

async function main() {
  console.log('\n🌱 Iniciando seed de usuarios de prueba...\n');
  
  // Hashear la contraseña una sola vez (es la misma para todos)
  const passwordHash = await bcryptjs.hash(PASSWORD_DEFAULT, 10);
  console.log('✅ Contraseña hasheada correctamente');
  
  let creados = 0;
  let existentes = 0;
  
  for (const usuario of usuariosPrueba) {
    // Verificar si el usuario ya existe
    const existente = await prisma.usuario.findUnique({
      where: { email: usuario.email },
    });
    
    if (existente) {
      console.log(`⚠️  Usuario ya existe: ${usuario.email} (${usuario.rol})`);
      existentes++;
      continue;
    }
    
    // Crear el usuario
    await prisma.usuario.create({
      data: {
        email: usuario.email,
        password: passwordHash,
        nombre: usuario.nombre,
        rol: usuario.rol,
        bodegaId: usuario.bodegaId,
        activo: true,
      },
    });
    
    console.log(`✅ Usuario creado: ${usuario.email} (${usuario.rol})`);
    creados++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed completado!');
  console.log(`   - Usuarios creados: ${creados}`);
  console.log(`   - Usuarios existentes: ${existentes}`);
  console.log('='.repeat(50));
  
  console.log('\n🔑 Credenciales de acceso:');
  console.log('   Contraseña para todos: password123');
  console.log('\n   👑 Admin:     admin@bodegas.com');
  console.log('   📦 Bodeguero: bodeguero@bodegas.com');
  console.log('   👤 Cliente:   cliente@bodegas.com');
  console.log('');
}

main()
  .catch((error) => {
    console.error('\n❌ Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
