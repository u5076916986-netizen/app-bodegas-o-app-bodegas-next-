// =============================================================================
// API: NextAuth.js Configuration
// =============================================================================
// Este archivo configura NextAuth.js para manejar la autenticación.
// Usa CredentialsProvider para login con email y contraseña.
// 
// IMPORTANTE: Asegúrate de tener NEXTAUTH_SECRET en tu .env
// =============================================================================

import NextAuth, { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

// Extender tipos de NextAuth para incluir rol y bodegaId
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      nombre: string;
      rol: 'ADMIN' | 'BODEGUERO' | 'CLIENTE';
      bodegaId: string | null;
    };
  }
  
  interface User {
    id: string;
    email: string;
    nombre: string;
    rol: 'ADMIN' | 'BODEGUERO' | 'CLIENTE';
    bodegaId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol: 'ADMIN' | 'BODEGUERO' | 'CLIENTE';
    bodegaId: string | null;
    nombre: string;
  }
}

// Configuración principal de NextAuth
export const authOptions: AuthOptions = {
  // Usamos JWT para manejar sesiones (no base de datos)
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  
  // Páginas personalizadas de autenticación
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  // Proveedores de autenticación
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      
      // Campos del formulario de login
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'tu@email.com' 
        },
        password: { 
          label: 'Contraseña', 
          type: 'password' 
        },
      },
      
      // Función que valida las credenciales
      async authorize(credentials): Promise<User | null> {
        // Validar que se enviaron email y password
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        // Buscar usuario en la base de datos
        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        // Si no existe el usuario
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }

        // Si el usuario está desactivado
        if (!usuario.activo) {
          throw new Error('Usuario desactivado. Contacta al administrador.');
        }

        // Verificar contraseña
        const isValid = await verifyPassword(
          credentials.password,
          usuario.password
        );

        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        // Devolver datos del usuario (sin contraseña)
        return {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
          bodegaId: usuario.bodegaId,
        };
      },
    }),
  ],
  
  // Callbacks para personalizar el comportamiento
  callbacks: {
    // Callback JWT: Se ejecuta cuando se crea/actualiza el token
    async jwt({ token, user }) {
      // Si hay usuario (primer login), agregar datos al token
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.bodegaId = user.bodegaId;
        token.nombre = user.nombre;
      }
      return token;
    },
    
    // Callback Session: Se ejecuta cuando se accede a la sesión
    async session({ session, token }) {
      // Pasar datos del token a la sesión
      session.user = {
        id: token.id as string,
        email: token.email as string,
        nombre: token.nombre as string,
        rol: token.rol as 'ADMIN' | 'BODEGUERO' | 'CLIENTE',
        bodegaId: token.bodegaId as string | null,
      };
      return session;
    },
  },
  
  // Secret para firmar tokens (IMPORTANTE: definir en .env)
  secret: process.env.NEXTAUTH_SECRET,
};

// Handlers para GET y POST
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
