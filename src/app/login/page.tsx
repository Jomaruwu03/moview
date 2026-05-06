import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const login = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect('/login?message=No+se+pudo+iniciar+sesión')
    }
    redirect('/')
  }

  const signup = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || email}`
        }
      }
    })

    if (error) {
      redirect('/login?message=No+se+pudo+registrar')
    }
    redirect('/login?message=Revisa+tu+correo+para+continuar')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-3xl font-bold text-center mb-6">MovieW</h1>
        
        <label className="text-md font-bold mt-4" htmlFor="email">Email</label>
        <input
          className="rounded-md px-4 py-2 bg-neutral-900 border border-neutral-800 mb-2"
          name="email"
          placeholder="tu@correo.com"
          required
        />
        
        <label className="text-md font-bold mt-4" htmlFor="username">Username (Solo para registro)</label>
        <input
          className="rounded-md px-4 py-2 bg-neutral-900 border border-neutral-800 mb-2"
          name="username"
          placeholder="cinemaphile"
        />

        <label className="text-md font-bold mt-4" htmlFor="password">Contraseña</label>
        <input
          className="rounded-md px-4 py-2 bg-neutral-900 border border-neutral-800 mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />

        <button
          formAction={login}
          className="bg-purple-600 rounded-md px-4 py-3 text-white mb-2 font-bold hover:bg-purple-700 transition"
        >
          Iniciar Sesión
        </button>
        <button
          formAction={signup}
          className="border border-neutral-700 rounded-md px-4 py-3 text-neutral-300 mb-2 font-bold hover:bg-neutral-800 transition"
        >
          Crear Cuenta
        </button>
      </form>
    </div>
  )
}
