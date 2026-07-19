import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Common/Logo";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");

  const loginError = touched && !loginValue.trim() ? "Введите email" : "";
  const passwordError =
    touched && password.length < 4 ? "Минимум 4 символа" : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!loginValue.trim() || password.length < 4) return;
    setLoading(true);
    try {
      await login(loginValue, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    setError("");
    setNotice("");
    if (!loginValue.trim())
      return setError(
        "Введите email, чтобы получить ссылку для создания пароля.",
      );
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      loginValue.trim(),
      {
        redirectTo: `${window.location.origin}/activate`,
      },
    );
    setLoading(false);
    if (resetError) setError(resetError.message);
    else
      setNotice(
        "Если аккаунт существует, письмо со ссылкой для создания пароля отправлено на указанный email.",
      );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white lg:flex">
        <img src="/images/mayak-night-reference.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(4,27,45,.94), rgba(4,27,45,.5)), radial-gradient(circle at 20% 20%, rgba(237,189,105,.22), transparent 40%)",
          }}
        />
        <div className="relative">
          <Logo onDark />
        </div>
        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Ваше дело —{" "}
            <span className="text-gold-300">под надёжным контролем</span>
          </h1>
          <p className="mt-4 max-w-md text-white/60">
            Личный кабинет клиента процедуры банкротства. Отслеживайте статус
            дела, финансы, документы и общайтесь с куратором — в одном месте.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <div>
              <div className="text-2xl font-bold text-gold-300">24/7</div>
              <div className="text-white/50">Доступ к делу</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gold-300">100%</div>
              <div className="text-white/50">Прозрачность</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gold-300">1500+</div>
              <div className="text-white/50">Клиентов</div>
            </div>
          </div>
        </div>
        <div className="relative text-xs text-white/35">
          © 2026 Маяк · Юридическое сопровождение банкротства
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-[#f7f9fc] px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold text-navy-800">Вход в кабинет</h2>
          <p className="mt-1 text-sm text-navy-400">
            Войдите, чтобы продолжить работу с вашим делом
          </p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Email
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                <input
                  type="email"
                  autoComplete="username"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="name@example.com"
                  className={`input-field pl-10 ${
                    loginError ? "border-rose-300 focus:ring-rose-100" : ""
                  }`}
                />
              </div>
              {loginError && (
                <p className="mt-1 text-xs text-rose-600">{loginError}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Пароль
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-10 ${
                    passwordError ? "border-rose-300 focus:ring-rose-100" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                  aria-label={
                    showPassword ? "Скрыть пароль" : "Показать пароль"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-rose-600">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Вход…
                </>
              ) : (
                "Войти"
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestPasswordReset()}
              className="w-full text-sm font-medium text-navy-500 hover:text-navy-800"
            >
              Создать или восстановить пароль
            </button>
            <button
              type="button"
              onClick={() => navigate("/demo")}
              className="btn-ghost w-full"
            >
              Открыть демо-кабинет
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
