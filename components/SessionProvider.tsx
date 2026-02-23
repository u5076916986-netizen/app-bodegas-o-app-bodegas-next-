// =============================================================================
// Componente: SessionProvider
// =============================================================================
// Wrapper de NextAuth para proveer la sesión a toda la aplicación.
// Debe usarse en el layout principal.
// =============================================================================

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

export default function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
