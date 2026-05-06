import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a MoView o crea una cuenta para empezar a compartir tus reseñas cinematográficas en formatos espectaculares.',
}

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
    <div className="flex-1 flex flex-col w-full items-center justify-center min-h-screen p-4 bg-gradient-to-b from-[#050505] to-[#1c1917] overflow-hidden relative">
      
      {/* Luces de fondo estilo marquesina (ambientales) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-[#b73038] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Caseta Container (Arco) */}
      <div className="relative w-full sm:max-w-md bg-[#0a0a0a]/60 backdrop-blur-2xl border-[6px] border-[#b73038] p-8 pt-16 sm:p-10 sm:pt-20 rounded-t-[8rem] rounded-b-[2rem] shadow-[0_0_80px_rgba(183,48,56,0.2)]">
        
        {/* Arch Marquee Text */}
        <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
          <p className="text-[#ecdab9] font-serif text-xl tracking-[0.5em] font-bold uppercase opacity-80 border-b-2 border-[#ecdab9]/20 pb-1">Box Office</p>
        </div>

        {/* Speaker Hole (Glass cutout) */}
        <div className="mx-auto w-16 h-16 rounded-full border-2 border-white/10 mb-8 flex items-center justify-center relative overflow-hidden bg-white/5 shadow-inner">
           <div className="grid grid-cols-3 gap-1">
             {[...Array(9)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>)}
           </div>
        </div>

        <form className="flex flex-col w-full gap-2 text-foreground relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-tighter mb-2 text-[#ecdab9] drop-shadow-[0_2px_10px_rgba(236,218,185,0.2)]">MoView</h1>
            <p className="text-[#ecdab9]/50 text-xs font-mono tracking-widest uppercase">Generador de Widgets</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-[10px] font-mono font-medium text-[#ecdab9]/70 mb-2 uppercase tracking-[0.2em]" htmlFor="email">Email</label>
            <input
              className="w-full bg-[#1c1917]/50 border-b-2 border-white/10 px-4 py-3 text-white focus:border-[#b73038] outline-none transition-all placeholder:text-white/20 rounded-t-lg"
              name="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-[10px] font-mono font-medium text-[#ecdab9]/70 mb-2 uppercase tracking-[0.2em]" htmlFor="username">Username <span className="text-white/30 font-normal normal-case tracking-normal">(solo registro)</span></label>
            <input
              className="w-full bg-[#1c1917]/50 border-b-2 border-white/10 px-4 py-3 text-white focus:border-[#b73038] outline-none transition-all placeholder:text-white/20 rounded-t-lg"
              name="username"
              placeholder="cinemaphile"
            />
          </div>

          <div className="mb-10">
            <label className="block text-[10px] font-mono font-medium text-[#ecdab9]/70 mb-2 uppercase tracking-[0.2em]" htmlFor="password">Contraseña</label>
            <input
              className="w-full bg-[#1c1917]/50 border-b-2 border-white/10 px-4 py-3 text-white focus:border-[#b73038] outline-none transition-all placeholder:text-white/20 rounded-t-lg"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <button
              formAction={login}
              className="w-full bg-[#b73038] text-[#ecdab9] rounded-lg px-4 py-4 font-black text-xl tracking-[0.3em] uppercase hover:bg-[#8f252b] transition-all shadow-[0_10px_30px_rgba(183,48,56,0.4)] hover:shadow-[0_10px_40px_rgba(183,48,56,0.6)] hover:-translate-y-1"
            >
              Admit One
            </button>
            <button
              formAction={signup}
              className="w-full bg-transparent border-2 border-dashed border-[#ecdab9]/30 rounded-lg px-4 py-3.5 text-[#ecdab9]/80 font-bold tracking-[0.1em] hover:bg-[#ecdab9]/10 hover:text-[#ecdab9] hover:border-[#ecdab9]/50 transition-colors uppercase text-sm"
            >
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
