"use client";

import { ArrowRight, X } from "lucide-react";
import { useState, type FormEvent } from "react";

type AuthMode = "sign-in" | "sign-up";

type AuthModalProps = {
  busy: boolean;
  supabaseReady: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onAuthenticate: (mode: AuthMode, email: string, password: string) => Promise<string | null>;
};

const inputClassName = "w-full rounded-lg border border-[#dce4dd] bg-white px-3 py-2.5 text-[13px] font-normal text-[#29352d] outline-none focus:border-[#7da187] focus:ring-4 focus:ring-[#eaf2eb]";
const labelClassName = "mb-4 grid gap-1.5 text-xs font-semibold text-[#58655c]";

export function AuthModal({ busy, supabaseReady, initialMode = "sign-in", onClose, onAuthenticate }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await onAuthenticate(mode, email, password);
    if (result) {
      setMessage(result);
      return;
    }
    setMessage("");
    setPassword("");
    onClose();
  }

  function changeMode() {
    setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
    setMessage("");
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-[rgba(24,36,27,0.48)] p-5 backdrop-blur-sm max-[600px]:items-end max-[600px]:p-[9px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="relative w-full max-w-[440px]  border border-[#e6ebe6] bg-white p-5 shadow-[0_24px_80px_rgba(15,24,15,0.2)] sm:p-8 max-[600px]:max-h-[calc(100vh-20px)] max-[600px]:overflow-auto" role="dialog" aria-modal="true" aria-labelledby="auth-heading">
        <button className="absolute right-[15px] top-[15px] grid size-9 place-items-center rounded-lg text-[#77837a] hover:bg-[#f2f5f2] focus-visible:outline-2 focus-visible:outline-green" onClick={onClose} aria-label="Close sign in">
          <X size={19} />
        </button>
        <span className="mb-[22px] inline-grid size-[31px] place-items-center rounded-[10px_10px_10px_3px] bg-green text-xl font-bold text-white">j</span>
        <h2 id="auth-heading" className="mb-2 mt-2 text-[25px] font-semibold tracking-[-0.8px] text-[#2b382f]">
          {mode === "sign-in" ? "Welcome back." : "Create your library."}
        </h2>
        <p className="mb-5 text-[13px] leading-relaxed text-muted">Keep your CVs, qualifications, and certificates in one private place.</p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label className={labelClassName}>Email address
            <input className={inputClassName} required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label className={labelClassName}>Password
            <input className={inputClassName} required type="password" minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>
          {message && <p className="text-xs text-[#a74738]" role="alert">{message}</p>}
          <button className="mt-1 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-green px-4 text-[13px] font-semibold text-white transition-colors hover:bg-green-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:cursor-not-allowed disabled:opacity-55" disabled={busy || !supabaseReady}>
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mb-0 mt-5 text-center text-[13px] text-muted">
          {mode === "sign-in" ? "New to Jobo?" : "Already have an account?"}{" "}
          <button className="rounded text-green hover:underline focus-visible:outline-2 focus-visible:outline-green" onClick={changeMode}>
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
        {!supabaseReady && <p className="mb-0 mt-4 text-xs text-[#a74738]">Add your Supabase URL and public key to the environment to enable accounts.</p>}
      </section>
    </div>
  );
}
