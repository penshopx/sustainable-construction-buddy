import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link reset password telah dikirim ke email Anda.");
      setIsForgot(false);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registrasi berhasil!");
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pub-amber/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-pub-amber-light" />
          </div>
          <span className="text-xl font-bold font-heading text-primary-foreground">PUB Konstruksi</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold font-heading text-primary-foreground leading-tight mb-4">
            Tingkatkan Kompetensi{" "}
            <span className="text-gradient-hero">Manajerial BUJK</span>
          </h2>
          <p className="text-primary-foreground/60 font-body text-lg max-w-md">
            Platform digital ASPEKINDO untuk assessment, learning, dan leveling kompetensi personil manajerial Badan Usaha Jasa Konstruksi.
          </p>
        </motion.div>

        <div className="flex gap-6">
          {["4 Level Kompetensi", "6 Domain Keahlian", "24 E-Course"].map((s) => (
            <div key={s} className="px-3 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/70 text-xs font-heading">
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-pub-amber/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-pub-amber" />
            </div>
            <span className="text-xl font-bold font-heading text-foreground">PUB Konstruksi</span>
          </div>

          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">
            {isForgot ? "Lupa Password" : isLogin ? "Masuk ke Akun" : "Daftar Akun Baru"}
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            {isForgot
              ? "Masukkan email Anda untuk menerima link reset password."
              : isLogin
              ? "Masuk untuk melanjutkan perjalanan kompetensi Anda."
              : "Buat akun untuk memulai assessment kompetensi."}
          </p>

          {isForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground font-heading mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  required
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-gradient-amber text-accent-foreground font-semibold font-heading shadow-amber hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Kirim Link Reset <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-foreground font-heading mb-1.5 block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground font-heading mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  required
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground font-heading mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="w-full h-11 px-4 pr-12 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-xs text-accent hover:underline mt-1.5"
                  >
                    Lupa password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-gradient-amber text-accent-foreground font-semibold font-heading shadow-amber hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {isLogin ? "Masuk" : "Daftar"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground font-body mt-6">
            {isForgot ? (
              <button onClick={() => setIsForgot(false)} className="text-accent font-semibold hover:underline">
                Kembali ke login
              </button>
            ) : (
              <>
                {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-accent font-semibold hover:underline"
                >
                  {isLogin ? "Daftar sekarang" : "Masuk"}
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
