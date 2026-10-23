import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, FormError, inputClass } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { InstallBanner } from '../components/layout/InstallBanner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message); // "Credenciales inválidas", "Demasiados intentos…", sin conexión, etc.
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-flox-600 text-white font-display font-extrabold text-2xl flex items-center justify-center" aria-hidden="true">F</div>
          <h1 className="font-display font-extrabold text-2xl">Flox</h1>
          <p className="text-sm text-slate-500">Iniciá sesión para continuar</p>
        </div>

        <InstallBanner />

        <Card className="p-5">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Email">
              <input
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Contraseña">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={inputClass + ' pr-12'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center text-slate-500"
                >
                  {showPassword ? <Icon.eyeOff className="w-5 h-5" /> : <Icon.eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>

            <FormError message={error} />

            <Button type="submit" disabled={submitting || !email || !password}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
