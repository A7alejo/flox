import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Card,
  Field,
  FormError,
  inputClass,
} from "../components/ui/Primitives";
import { Icon } from "../components/ui/Icon";
import { Marca, Ola } from "../components/ui/Marca";
import { InstallBanner } from "../components/layout/InstallBanner";

// Ingreso: arriba la franja azul de la etiqueta Flox con la ola; abajo el formulario.
export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex flex-col">
      <div className="bg-tinta text-white px-6 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2rem))] pb-14 md:pb-20">
        <div className="escalonado w-full max-w-sm mx-auto flex flex-col items-start gap-4">
          <Marca claro className="w-14 h-14" />
          <div>
            <h1 className="font-display font-extrabold text-5xl leading-none">Floxer</h1>
            <p className="mt-2 text-base text-white/80">Stock, caja y envíos de Flox.</p>
          </div>
        </div>
      </div>
      <Ola className="h-4 md:h-6 -mt-px" />

      <div className="flex-1 px-4 pt-6 pb-10">
        <div className="escalonado w-full max-w-sm mx-auto flex flex-col gap-5">
          <InstallBanner />

          <Card className="p-5">
            <form onSubmit={submit} className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-2xl leading-none text-tinta">Iniciá sesión</h2>
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
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={inputClass + " pr-12"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center text-slate-500"
                  >
                    {showPassword ? (
                      <Icon.eyeOff className="w-5 h-5" />
                    ) : (
                      <Icon.eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </Field>

              <FormError message={error} />

              <Button type="submit" disabled={submitting || !email || !password}>
                {submitting ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
