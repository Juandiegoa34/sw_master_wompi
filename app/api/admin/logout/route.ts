// app/api/admin/logout/route.ts
// Cierra la sesión del admin eliminando la cookie de sesión y redirigiendo al login.
// Solo acepta POST — el layout llama a esta ruta desde un <form method="POST">.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE_NAME } from '@src/shared/lib/auth'

export async function POST(): Promise<never> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)

  // redirect() lanza una excepción interna de Next.js — no atrapar.
  redirect('/admin/login')
}
