import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (no requieren autenticación)
  const publicPaths = ['/auth/login', '/auth/register'];
  const isPublicPath = publicPaths.includes(pathname);

  // Rutas de admin
  const adminPaths = ['/admin'];
  const isAdminPath = pathname.startsWith('/admin');

  // Rutas de estudiante
  const studentPaths = ['/student'];
  const isStudentPath = pathname.startsWith('/student');

  // Permitir acceso a rutas públicas sin verificación
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas protegidas, el cliente manejará la redirección
  // ya que el token está en localStorage y no es accesible desde el middleware
  // El middleware solo permite el paso, los layouts se encargan de la validación
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

