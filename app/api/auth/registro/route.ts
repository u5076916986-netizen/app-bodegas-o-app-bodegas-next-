// =============================================================================
// API: Registro de Usuarios
// =============================================================================
// Endpoint para crear nuevas cuentas de usuario.
// Valida los datos, hashea la contraseña y guarda en la base de datos.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación con Zod
const registroSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  // Por defecto, los usuarios se registran como CLIENTE
  // Solo un ADMIN puede crear BODEGUERO o ADMIN
});

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener y validar datos del body
    const body = await request.json();
    const validacion = registroSchema.safeParse(body);
    
    if (!validacion.success) {
      // Retornar errores de validación
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          detalles: validacion.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    const { email, password, nombre } = validacion.data;
    
    // 2. Verificar si el email ya está registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });
    
    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }
    
    // 3. Hashear la contraseña (NUNCA guardar contraseñas en texto plano)
    const passwordHash = await hashPassword(password);
    
    // 4. Crear el usuario en la base de datos
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        rol: 'CLIENTE', // Por defecto, todos son clientes
        activo: true,
      },
      // Seleccionar solo los campos que queremos devolver (sin password)
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
      },
    });
    
    // 5. Responder con éxito
    return NextResponse.json(
      { 
        mensaje: '¡Cuenta creada exitosamente!',
        usuario: nuevoUsuario 
      },
      { status: 201 }
    );
    
  } catch (error) {
    // Log del error para debugging
    console.error('Error en registro:', error);
    
    return NextResponse.json(
      { error: 'Error al crear la cuenta. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
