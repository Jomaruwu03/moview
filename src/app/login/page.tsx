'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Loader2, Languages, Cat } from 'lucide-react'
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
    <div className="flex-1 flex flex-col w-full items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 glass-card border border-white/10 text-on-surface-variant px-5 py-2 rounded-full hover:text-primary transition-all duration-500 font-body text-[10px] uppercase tracking-widest"
        >
          <Languages className="w-3 h-3" />
          <span>{language === 'es' ? 'ES' : 'EN'}</span>
        </button>
      </div>

      <div className="w-full sm:max-w-xl lg:max-w-5xl grid lg:grid-cols-2 gap-0 overflow-hidden glass-card border border-white/10 rounded-[3rem] shadow-2xl relative z-10">
        {/* Left Side: Editorial Content */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-white/[0.02] border-r border-white/5 relative">
          <div className="absolute top-16 right-16 opacity-10">
            <Cat className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10">
            <span className="font-body text-xs uppercase tracking-[0.4em] text-primary mb-4 block">Archive No. 2026</span>
            <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter text-white mb-8 leading-none">
              MEO<br/>WIEW
            </h1>
          </div>
          
          <div className="space-y-8 relative z-10">
            <p className="font-display italic text-4xl text-on-surface-variant leading-tight">
              {language === 'es' 
                ? 'El cine no se trata de lo que está en el marco, sino de lo que tú sientes al verlo.' 
                : 'Cinema is not about what is in the frame, it is about what you feel when you see it.'}
            </p>
            <div className="flex gap-4">
              <div className="w-12 h-1 bg-primary/30"></div>
              <p className="font-body text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold max-w-xs">
                {language === 'es' 
                  ? 'TU ESPACIO PERSONAL PARA RESEÑAR, ORGANIZAR Y DESCUBRIR EL SÉPTIMO ARTE.' 
                  : 'YOUR PERSONAL SPACE TO REVIEW, ORGANIZE, AND DISCOVER THE SEVENTH ART.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-16 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-10">
            <div className="flex justify-center mb-4">
              <Cat className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-5xl uppercase tracking-widest text-primary mb-4">MEOWIEW</h1>
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Editorial Cinema Platform</p>
          </div>

          <form className="flex flex-col w-full gap-6">
            <div className="space-y-6 mb-8">
              <div className="group">
                <label className="block font-body text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-3 group-focus-within:text-primary transition-colors" htmlFor="email">Email</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500 placeholder:text-white/20"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'es' ? 'tu@correo.com' : 'you@email.com'}
                  required
                />
              </div>
              
              <div className="group">
                <label className="block font-body text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-3 group-focus-within:text-primary transition-colors" htmlFor="username">
                  {language === 'es' ? 'Usuario ' : 'Username '}
                  <span className="text-white/20 normal-case tracking-normal">{language === 'es' ? '(solo registro)' : '(signup only)'}</span>
                </label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500 placeholder:text-white/20"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cinemaphile"
                />
              </div>

              <div className="group">
                <label className="block font-body text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-3 group-focus-within:text-primary transition-colors" htmlFor="password">{language === 'es' ? 'Contraseña' : 'Password'}</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500 placeholder:text-white/20"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <button
                onClick={handleLogin}
                disabled={isLoading !== null}
                className="w-full py-5 bg-primary text-on-primary font-body text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(236,178,255,0.2)] hover:shadow-[0_15px_40px_rgba(236,178,255,0.3)] hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading === 'login' ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Entrar a la Sala' : 'Enter the Theater')}
              </button>
              
              <button
                onClick={handleSignup}
                disabled={isLoading !== null}
                className="w-full py-5 border-[0.5px] border-white/10 font-body text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-white/5 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading === 'signup' ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Crear una Cuenta' : 'Sign Up')}
              </button>
            </div>
          </form>
          
          <div className="mt-12 text-center lg:text-left">
            <p className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant opacity-40">
              © 2026 MEOWIEW EDITORIAL — OPEN SOURCE PROJECT
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
