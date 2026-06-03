'use client'

import { useState, useEffect } from 'react'
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
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot-password'>('login')
  const [rememberMe, setRememberMe] = useState(false)
  
  const [isLoading, setIsLoading] = useState<'login' | 'signup' | 'forgot' | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const errorMsg = params.get('error') || params.get('message')
      if (errorMsg) {
        toast.error(language === 'es' ? 'Error de verificación' : 'Verification error', {
          description: decodeURIComponent(errorMsg).replace(/\+/g, ' ')
        })
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      const rememberedEmail = localStorage.getItem('meowiew_remembered_email')
      const rememberedPassword = localStorage.getItem('meowiew_remembered_password')
      if (rememberedEmail) {
        setEmail(rememberedEmail)
        setRememberMe(true)
      }
      if (rememberedPassword) {
        setPassword(rememberedPassword)
      }
    }
  }, [language])

  const validate = (isSignup: boolean) => {
    if (!email || !email.includes('@')) {
      toast.error(language === 'es' ? 'Correo inválido' : 'Invalid email', { description: language === 'es' ? 'Por favor, ingresa un correo electrónico válido.' : 'Please enter a valid email address.' })
      return false
    }
    if (!password || password.length < 6) {
      toast.error(language === 'es' ? 'Contraseña muy corta' : 'Password too short', { description: language === 'es' ? 'Tu contraseña debe tener al menos 6 caracteres.' : 'Your password must be at least 6 characters long.' })
      return false
    }
    if (isSignup) {
      if (!username) {
        toast.error(language === 'es' ? 'Falta usuario' : 'Missing username', { description: language === 'es' ? 'Por favor, escoge un nombre de usuario.' : 'Please choose a username.' })
        return false
      }
      if (username.length < 3 || username.length > 20) {
        toast.error(language === 'es' ? 'Usuario inválido' : 'Invalid username', { description: language === 'es' ? 'El usuario debe tener entre 3 y 20 caracteres.' : 'Username must be between 3 and 20 characters.' })
        return false
      }
      const usernameRegex = /^[a-zA-Z0-9_-]+$/
      if (!usernameRegex.test(username)) {
        toast.error(language === 'es' ? 'Usuario inválido' : 'Invalid username', { description: language === 'es' ? 'Solo se permiten letras, números, guiones y guiones bajos.' : 'Only letters, numbers, hyphens, and underscores are allowed.' })
        return false
      }
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
        if (rememberMe) {
          localStorage.setItem('meowiew_remembered_email', email)
          localStorage.setItem('meowiew_remembered_password', password)
        } else {
          localStorage.removeItem('meowiew_remembered_email')
          localStorage.removeItem('meowiew_remembered_password')
        }
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
      // 1. Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (existingUser) {
        toast.error(
          language === 'es' ? 'Usuario no disponible' : 'Username taken',
          { description: language === 'es' ? 'Este nombre de usuario ya está registrado.' : 'This username is already taken.' }
        )
        setIsLoading(null)
        return
      }

      // 2. Perform sign up with redirect options
      const redirectUrl = `${window.location.origin}/auth/callback`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
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
        toast.info(
          language === 'es' ? 'Verifica tu correo' : 'Verify your email',
          {
            description: language === 'es'
              ? 'Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta.'
              : 'We have sent you a confirmation email. Please check your inbox (and spam folder) to activate your account.'
          }
        )
      }
    } catch (err: any) {
      toast.error(language === 'es' ? 'Error inesperado' : 'Unexpected error', { description: err?.message || (language === 'es' ? 'No pudimos conectarnos.' : 'We could not connect.') })
    } finally {
      setIsLoading(null)
    }
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error(language === 'es' ? 'Correo inválido' : 'Invalid email', { description: language === 'es' ? 'Por favor, ingresa un correo electrónico válido.' : 'Please enter a valid email address.' })
      return
    }

    setIsLoading('login')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/?tab=profile`
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success(
          language === 'es' 
            ? '¡Enlace enviado! Revisa tu bandeja de entrada.' 
            : 'Link sent! Check your inbox.'
        )
        setViewMode('login')
      }
    } catch (err: any) {
      toast.error(err.message)
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
              <Cat className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h1 className="font-display text-5xl uppercase tracking-widest text-primary mb-2">MEOWIEW</h1>
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-6">Editorial Cinema Platform</p>
            <p className="font-body text-xs text-on-surface-variant/80 max-w-sm mx-auto leading-relaxed border-t border-white/5 pt-4">
              {language === 'es' 
                ? 'Tu espacio personal para reseñar películas, organizar tu Top 5 y descubrir el séptimo arte con estilo editorial.' 
                : 'Your personal space to review movies, organize your Top 5, and discover cinema with an editorial style.'}
            </p>
          </div>

          {/* Login / Register Switch */}
          {viewMode !== 'forgot-password' ? (
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-full mb-8">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className={`flex-1 py-3 rounded-full font-body text-xs uppercase tracking-widest transition-all duration-300 ${
                  viewMode === 'login' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {language === 'es' ? 'Iniciar Sesión' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('signup')}
                className={`flex-1 py-3 rounded-full font-body text-xs uppercase tracking-widest transition-all duration-300 ${
                  viewMode === 'signup' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {language === 'es' ? 'Registrarse' : 'Sign Up'}
              </button>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl text-white italic mb-2">
                {language === 'es' ? 'Recuperar Contraseña' : 'Recover Password'}
              </h2>
              <p className="font-body text-xs text-on-surface-variant">
                {language === 'es' 
                  ? 'Te enviaremos un enlace para que puedas reestablecer tu acceso.' 
                  : 'We will send you a link to reset your access.'}
              </p>
            </div>
          )}

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
              
              {viewMode === 'signup' && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block font-body text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-3 group-focus-within:text-primary transition-colors" htmlFor="username">
                    {language === 'es' ? 'Usuario' : 'Username'}
                  </label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-body text-sm outline-none focus:border-primary/40 focus:bg-white/10 transition-all duration-500 placeholder:text-white/20"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="cinemaphile"
                    required
                  />
                </div>
              )}

              {viewMode !== 'forgot-password' && (
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
              )}
            </div>

            {viewMode === 'login' && (
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center gap-3 cursor-pointer group text-xs text-on-surface-variant hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                  />
                  <span>{language === 'es' ? 'Recordar credenciales' : 'Remember credentials'}</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setViewMode('forgot-password')}
                  className="font-body text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary transition-colors border-b border-primary/20"
                >
                  {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-4">
              {viewMode === 'login' && (
                <button
                  type="submit"
                  onClick={handleLogin}
                  disabled={isLoading !== null}
                  className="w-full py-5 bg-primary text-on-primary font-body text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(212,178,255,0.2)] hover:shadow-[0_15px_40px_rgba(212,178,255,0.3)] hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading === 'login' ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Entrar a la Sala' : 'Enter the Theater')}
                </button>
              )}
              
              {viewMode === 'signup' && (
                <button
                  type="submit"
                  onClick={handleSignup}
                  disabled={isLoading !== null}
                  className="w-full py-5 bg-primary text-on-primary font-body text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(212,178,255,0.2)] hover:shadow-[0_15px_40px_rgba(212,178,255,0.3)] hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading === 'signup' ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Crear una Cuenta' : 'Sign Up')}
                </button>
              )}

              {viewMode === 'forgot-password' && (
                <div className="space-y-4">
                  <button
                    type="submit"
                    onClick={handleForgotPassword}
                    disabled={isLoading !== null}
                    className="w-full py-5 bg-primary text-on-primary font-body text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(212,178,255,0.2)] hover:shadow-[0_15px_40px_rgba(212,178,255,0.3)] hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading === 'login' ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Enviar Enlace' : 'Send Recovery Link')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="w-full py-4 border border-white/10 hover:border-white/20 text-on-surface-variant hover:text-white rounded-2xl font-body text-[10px] uppercase tracking-widest transition-all duration-300 bg-transparent flex items-center justify-center"
                  >
                    {language === 'es' ? 'Volver al Inicio de Sesión' : 'Back to Log In'}
                  </button>
                </div>
              )}
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
