'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const [isLoading, setIsLoading] = useState<'login' | 'signup' | null>(null)

  const supabase = createClient()

  const validate = (isSignup: boolean) => {
    if (!email || !email.includes('@')) {
      toast.error('Correo inválido', { description: 'Por favor, ingresa un correo electrónico válido.' })
      return false
    }
    if (!password || password.length < 6) {
      toast.error('Contraseña muy corta', { description: 'Tu contraseña debe tener al menos 6 caracteres.' })
      return false
    }
    if (isSignup && !username) {
      toast.error('Falta usuario', { description: 'Por favor, escoge un nombre de usuario.' })
      return false
    }
    return true
  }

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!validate(false)) return

    setIsLoading('login')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Error al iniciar sesión', { description: error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message })
      } else {
        toast.success('¡Bienvenido de vuelta!')
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      toast.error('Error inesperado', { description: err?.message || 'Ocurrió un problema de red.' })
    } finally {
      setIsLoading(null)
    }
  }

  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!validate(true)) return

    setIsLoading('signup')
    try {
      const { data, error } = await supabase.auth.signUp({
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
        toast.error('Error de registro', { description: error.message })
      } else if (data.session) {
        toast.success('Cuenta creada', { description: '¡Bienvenido! Entrando al panel...' })
        router.push('/')
        router.refresh()
      } else {
        toast.info('Verifica tu correo', { description: 'Por seguridad, revisa tu bandeja de entrada para activar tu cuenta. Si desactivas esta opción en Supabase, entrarás automáticamente.' })
      }
    } catch (err: any) {
      toast.error('Error inesperado', { description: err?.message || 'No pudimos conectarnos.' })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full items-center justify-center min-h-screen p-4 bg-neutral-950">
      <div className="w-full sm:max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
        <form className="flex flex-col w-full gap-2 text-foreground">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              MoView
            </h1>
            <p className="text-neutral-400 text-sm">Crea tus widgets cinematográficos</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="email">Email</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-600"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="username">Usuario <span className="text-neutral-600 font-normal">(solo registro)</span></label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-600"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cinemaphile"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="password">Contraseña</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-600"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-xl px-4 py-3.5 font-bold hover:bg-neutral-200 transition-colors shadow-lg disabled:opacity-50"
            >
              {isLoading === 'login' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
            <button
              onClick={handleSignup}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-neutral-800 rounded-xl px-4 py-3.5 text-neutral-300 font-bold hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoading === 'signup' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
