'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Loader2, Languages } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const [isLoading, setIsLoading] = useState<'login' | 'signup' | null>(null)

  const supabase = createClient()

  const validate = (isSignup: boolean) => {
    if (!email || !email.includes('@')) {
      toast.error(language === 'es' ? 'Correo inválido' : 'Invalid email', { description: language === 'es' ? 'Por favor, ingresa un correo electrónico válido.' : 'Please enter a valid email address.' })
      return false
    }
    if (!password || password.length < 6) {
      toast.error(language === 'es' ? 'Contraseña muy corta' : 'Password too short', { description: language === 'es' ? 'Tu contraseña debe tener al menos 6 caracteres.' : 'Your password must be at least 6 characters long.' })
      return false
    }
    if (isSignup && !username) {
      toast.error(language === 'es' ? 'Falta usuario' : 'Missing username', { description: language === 'es' ? 'Por favor, escoge un nombre de usuario.' : 'Please choose a username.' })
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
        toast.error(language === 'es' ? 'Error al iniciar sesión' : 'Login error', { description: error.message === 'Invalid login credentials' ? (language === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.') : error.message })
      } else {
        toast.success(language === 'es' ? '¡Bienvenido de vuelta!' : 'Welcome back!')
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(language === 'es' ? 'Error inesperado' : 'Unexpected error', { description: err?.message || (language === 'es' ? 'Ocurrió un problema de red.' : 'A network problem occurred.') })
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
        toast.error(language === 'es' ? 'Error de registro' : 'Signup error', { description: error.message })
      } else if (data.session) {
        toast.success(language === 'es' ? 'Cuenta creada' : 'Account created', { description: language === 'es' ? '¡Bienvenido! Entrando al panel...' : 'Welcome! Entering dashboard...' })
        router.push('/')
        router.refresh()
      } else {
        toast.info(language === 'es' ? 'Verifica tu correo' : 'Verify your email', { description: language === 'es' ? 'Por seguridad, revisa tu bandeja de entrada para activar tu cuenta. Si desactivas esta opción en Supabase, entrarás automáticamente.' : 'For security, check your inbox to activate your account. If you disable this in Supabase, you will log in automatically.' })
      }
    } catch (err: any) {
      toast.error(language === 'es' ? 'Error inesperado' : 'Unexpected error', { description: err?.message || (language === 'es' ? 'No pudimos conectarnos.' : 'We could not connect.') })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full items-center justify-center min-h-screen p-4 bg-neutral-950">
      
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-300 px-4 py-2 rounded-full hover:text-white hover:bg-neutral-800 transition-colors shadow-lg"
        >
          <Languages className="w-4 h-4" />
          <span className="text-sm font-medium">{language === 'es' ? 'ES' : 'EN'}</span>
        </button>
      </div>

      <div className="w-full sm:max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative">
        <form className="flex flex-col w-full gap-2 text-foreground">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              MoView
            </h1>
            <p className="text-neutral-300 text-sm leading-relaxed px-2">
              {language === 'es' 
                ? 'Tu espacio personal para reseñar, organizar y descubrir cine. Crea widgets estéticos para tus redes sociales, arma tu Top Personal y acepta el Reto de 365 Días.' 
                : 'Your personal space to review, organize, and discover cinema. Create aesthetic widgets for social media, build your Personal Top, and take on the 365 Days Challenge.'}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="email">Email</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-600"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'es' ? 'tu@correo.com' : 'you@email.com'}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="username">
              {language === 'es' ? 'Usuario ' : 'Username '}
              <span className="text-neutral-600 font-normal">{language === 'es' ? '(solo registro)' : '(signup only)'}</span>
            </label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-600"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cinemaphile"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-400 mb-2" htmlFor="password">{language === 'es' ? 'Contraseña' : 'Password'}</label>
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
              {isLoading === 'login' ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'es' ? 'Iniciar Sesión' : 'Log In')}
            </button>
            <button
              onClick={handleSignup}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-neutral-800 rounded-xl px-4 py-3.5 text-neutral-300 font-bold hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoading === 'signup' ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'es' ? 'Crear Cuenta' : 'Sign Up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
