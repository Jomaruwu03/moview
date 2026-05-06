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
    <div className="flex-1 flex flex-col w-full items-center justify-center min-h-screen p-4">
      <div className="w-full sm:max-w-md bg-neutral-900/40 backdrop-blur-xl border border-white/5 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
        <form className="flex flex-col w-full gap-2 text-foreground">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tight mb-2">MoView</h1>
            <p className="text-neutral-400 text-sm">Crea tus widgets cinematográficos</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="email">Email</label>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
              name="email"
              placeholder="tu@correo.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="username">Username <span className="text-neutral-600 font-normal">(solo registro)</span></label>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
              name="username"
              placeholder="cinemaphile"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="password">Contraseña</label>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full bg-white text-black rounded-xl px-4 py-3.5 font-bold hover:bg-neutral-200 transition-colors shadow-lg"
            >
              Iniciar Sesión
            </button>
            <button
              formAction={signup}
              className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3.5 text-neutral-300 font-bold hover:bg-white/5 hover:text-white transition-colors"
            >
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
