import { useState, useCallback } from "react";
import { Mail, Lock, User as UserIcon, Camera, Eye, EyeOff, AtSign, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

// Password must be 8+ chars, 1 uppercase, 1 number, 1 special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

interface Requirement { label: string; test: (pw: string) => boolean; }
const REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character (!@#$…)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const PasswordRequirements = ({ password }: { password: string }) => (
  <ul className="space-y-1 mt-2 px-1">
    {REQUIREMENTS.map((r) => {
      const ok = r.test(password);
      return (
        <li key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-green-500" : "text-muted-foreground"}`}>
          {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {r.label}
        </li>
      );
    })}
  </ul>
);

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, checkHandleAvailable } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingSrc(URL.createObjectURL(f));
    e.target.value = "";
  };

  const onHandleBlur = useCallback(async () => {
    if (!handle) return;
    const clean = handle.replace(/[^a-z0-9_]/gi, "").toLowerCase();
    if (clean !== handle) { setHandle(clean); }
    if (clean.length < 3) { setHandleError("Handle must be at least 3 characters"); return; }
    const available = await checkHandleAvailable(clean);
    setHandleError(available ? "" : "Handle is already taken");
  }, [handle, checkHandleAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      if (!PASSWORD_REGEX.test(password)) {
        toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", description: "Please make sure both passwords are identical.", variant: "destructive" });
        return;
      }
      if (handleError) {
        toast({ title: "Invalid handle", description: handleError, variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error, needsConfirmation } = await signUp(email, password, name, handle);
        if (error) throw new Error(error);
        if (needsConfirmation) {
          toast({
            title: "Check your email! 📬",
            description: `We sent a confirmation link to ${email}. Click it to activate your account.`,
          });
          // Stay on page — user needs to confirm before they can sign in
          setSubmitting(false);
          return;
        }
        toast({ title: "Welcome to Plugg! 🎵" });
        navigate("/account");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error);
        toast({ title: "Welcome back! 🎵" });
        navigate("/account");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  const inputCls = "w-full pl-11 pr-11 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Plugg" className="h-12 w-auto mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">
              {mode === "signin" ? "Welcome back, listener." : "Join the community of listeners."}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-card border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                {/* Photo picker */}
                <div className="flex justify-center pb-1">
                  <label className="relative cursor-pointer">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {photo ? (
                        <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={28} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                      <Camera size={12} className="text-primary-foreground" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                  </label>
                </div>

                {/* Full name */}
                <div className="relative">
                  <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Full name" value={name}
                    onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </div>

                {/* Handle */}
                <div className="relative">
                  <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="handle (e.g. john_doe)" value={handle}
                    onChange={(e) => { setHandle(e.target.value.toLowerCase()); setHandleError(""); }}
                    onBlur={onHandleBlur} required minLength={3} className={inputCls} />
                </div>
                {handleError && <p className="text-xs text-destructive px-1">{handleError}</p>}
              </>
            )}

            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => mode === "signup" && setShowRequirements(true)}
                required
                className={inputCls}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "signup" && showRequirements && <PasswordRequirements password={password} />}

            {/* Confirm password (signup only) */}
            {mode === "signup" && (
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${inputCls} ${confirmPassword && confirmPassword !== password ? "ring-2 ring-destructive/50" : ""}`}
                />
                <button type="button" onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {mode === "signin" && (
              <div className="text-right">
                <button type="button"
                  onClick={() => toast({ title: "Coming soon", description: "Password reset coming shortly." })}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
              {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "signin" ? "New to plugg?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setShowRequirements(false); }}
              className="text-primary font-semibold hover:underline">
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing you agree to plugg's Terms & Privacy.
          </p>
        </div>
      </main>

      <ImageCropper
        open={!!pendingSrc}
        src={pendingSrc}
        aspect={1}
        shape="circle"
        outputWidth={512}
        onCancel={() => setPendingSrc(null)}
        onConfirm={(url) => { setPhoto(url); setPendingSrc(null); }}
      />
    </div>
  );
};

export default Auth;
