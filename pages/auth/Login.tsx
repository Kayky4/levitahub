import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao entrar. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-midnight-900 relative overflow-hidden justify-center items-center p-4 transition-colors duration-300">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <GlassCard className="w-full max-w-md relative z-10 border-gray-200 dark:border-white/10 bg-white/80 dark:bg-midnight-800/50 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="font-bold text-white text-3xl">L</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Bem-vindo de volta</h2>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Acesse seu painel de regência e gerencie seu ministério com excelência.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="EMAIL"
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white dark:bg-black/20 border-gray-300 dark:border-white/10 focus:bg-gray-50 dark:focus:bg-black/40"
          />

          <div>
            <Input
              label="Senha"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white dark:bg-black/20 border-gray-300 dark:border-white/10 focus:bg-gray-50 dark:focus:bg-black/40"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              }
            />
            <div className="flex justify-end mt-1">
              <a href="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">Esqueceu a senha?</a>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-600 dark:text-red-200 text-sm">{error}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-0 text-white shadow-lg shadow-indigo-500/20"
              size="lg"
            >
              Entrar na Plataforma
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Ainda não tem uma conta?{' '}
            <Link to="/signup" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors relative group">
              Criar conta gratuitamente
              <span className="absolute bottom-0 left-0 w-0 h-px bg-indigo-600 dark:bg-indigo-400 transition-all group-hover:w-full"></span>
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;