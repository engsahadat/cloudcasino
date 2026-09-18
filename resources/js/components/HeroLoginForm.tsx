import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, EyeOff, Eye, Loader2, ArrowRight, Lock, ShieldCheck, Headphones, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/validation";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface HeroLoginFormProps {
  onSwitchToRegister: () => void;
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials"))
    return "Incorrect email/username or password. Please try again.";
  if (lower.includes("email not confirmed"))
    return "Your email hasn't been verified yet. Check your inbox.";
  if (lower.includes("too many requests") || lower.includes("rate limit"))
    return "Too many attempts. Please wait a moment and try again.";
  if (lower.includes("user not found") || lower.includes("no account"))
    return "We couldn't find an account with that info.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Connection issue. Please check your internet and retry.";
  return raw;
}

const TRUST_BADGES = [
  { icon: Lock, label: "SSL Secured" },
  { icon: ShieldCheck, label: "Account Protected" },
  { icon: Headphones, label: "Instant Support" },
];

const HeroLoginForm = ({ onSwitchToRegister }: HeroLoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, role, user } = useAuth();
  const navigate = useNavigate();
  const pendingRedirect = useRef(false);

  useEffect(() => {
    if (pendingRedirect.current && user && role) {
      pendingRedirect.current = false;
      const name = user.name || user.username || user.email?.split("@")[0] || "Player";
      toast({
        title: `Welcome back, ${name} 👋`,
        description: "Your account is secure.",
      });
      const target = role === "admin" || role === "manager" ? "/admin" : "/home";
      navigate(target);
    }
  }, [role, user, navigate]);

  const handleCapsLock = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email or username."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setError("");
    setLoading(true);
    try {
      pendingRedirect.current = true;
      const { error: authError } = await signIn(email.trim(), password);
      if (authError) {
        pendingRedirect.current = false;
        setError(friendlyError(parseApiError(authError)));
        setLoading(false);
        return;
      }
    } catch (err) {
      pendingRedirect.current = false;
      setError(friendlyError(parseApiError(err)));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotSent(true);
      toast({ title: "Check your email", description: "If an account exists, a password reset link has been sent." });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || err?.message || "Something went wrong", variant: "destructive" });
    }
    setForgotLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-indigo-500/30 bg-[#0f1426]/90 p-6 sm:p-8 shadow-[0_0_45px_rgba(79,70,229,0.25)] backdrop-blur-xl sm:max-w-none max-w-md mx-auto">
        {forgotMode ? (
          <>
            <button
              onClick={() => { setForgotMode(false); setForgotSent(false); setError(""); }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
            <h3 className="font-display text-lg font-extrabold tracking-wider text-center text-white mb-1">
              RESET PASSWORD
            </h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              {forgotSent ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
            </p>
            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
            {!forgotSent && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-slate-700/60 bg-[#141a2e] px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h3 className="font-display text-lg font-extrabold tracking-wider text-center text-white mb-1">
              LOGIN TO PLAY NOW
            </h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              Win big with exciting sweepstakes, fish games &amp; slots online
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email or Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com or username"
                      className="w-full rounded-xl border border-slate-700/60 bg-[#141a2e] px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleCapsLock}
                      onKeyUp={handleCapsLock}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-700/60 bg-[#141a2e] px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {capsLock && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 text-xs text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Caps Lock is on
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-700 bg-[#141a2e] accent-indigo-500 cursor-pointer" />
                  <span className="text-xs text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(""); setForgotSent(false); setForgotEmail(email.includes("@") ? email : ""); }}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <span>Login &amp; Play</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-around border-t border-slate-800/80 pt-5">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              Don't have an account?{" "}
              <button onClick={onSwitchToRegister} className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors">
                Register Now
              </button>
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HeroLoginForm;
