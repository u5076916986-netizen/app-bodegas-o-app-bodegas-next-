import { redirect } from 'next/navigation';

export default function AuthPage() {
    // Redirigir automáticamente a la sección de bodegas
    redirect('/bodegas');
}
