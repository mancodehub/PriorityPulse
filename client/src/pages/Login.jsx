import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { sendOtp, verifyOtp } from '../api/client';
import OtpInput from '../components/OtpInput';

const RESEND_COOLDOWN = 30; // seconds

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const requestOtp = async (isResend = false) => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TEMPORARY DEVELOPMENT-ONLY AUTH BYPASS
      if (!import.meta.env.DEV) await sendOtp(email);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
      if (!isResend) setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TEMPORARY DEVELOPMENT-ONLY AUTH BYPASS
      if (import.meta.env.DEV) {
        localStorage.setItem('pp_token', 'development-token');
      } else {
        const { data } = await verifyOtp(email, otp);
        localStorage.setItem('pp_token', data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'That code didn\u2019t work. Try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <PulseMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            PriorityPulse
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
          <PulseLine active={loading} />

          <div className="px-8 pb-9 pt-7">
            {step === 'email' ? (
              <>
                <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
                <p className="mt-1.5 text-sm text-ink/60">
                  No password to remember. We&rsquo;ll email you a one-time code.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    requestOtp(false);
                  }}
                  className="mt-6 space-y-4"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50">
                      Email address
                    </span>
                    <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-paper/60 px-3.5 py-3 transition focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/20">
                      <Mail className="h-4 w-4 shrink-0 text-ink/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
                        autoFocus
                      />
                    </div>
                  </label>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-medium text-white transition hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Sending code' : 'Continue with email'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setStep('email');
                    setError('');
                    setOtp('');
                  }}
                  className="mb-4 flex items-center gap-1 text-xs font-medium text-ink/50 transition hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <h1 className="font-display text-2xl font-semibold text-ink">Enter your code</h1>
                <p className="mt-1.5 text-sm text-ink/60">
                  We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
                </p>

                <form onSubmit={submitOtp} className="mt-6 space-y-5">
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-medium text-white transition hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {loading ? 'Verifying' : 'Verify & sign in'}
                  </button>

                  <p className="text-center text-xs text-ink/50">
                    {cooldown > 0 ? (
                      <>Resend code in {cooldown}s</>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestOtp(true)}
                        className="font-medium text-cobalt hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="13" className="fill-ink" />
      <path
        d="M4 13h4l2-5 3 10 2.5-7 1.5 2h5"
        stroke="#FFB020"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PulseLine({ active }) {
  return (
    <div className="relative h-1 w-full overflow-hidden bg-ink/5">
      <div className="absolute inset-0 bg-gradient-to-r from-cobalt/0 via-cobalt/40 to-cobalt/0" />
      {active && (
        <div className="absolute top-1/2 h-2 w-2 -translate-y-1/2 animate-travel rounded-full bg-pulse shadow-[0_0_8px_rgba(255,176,32,0.8)]" />
      )}
    </div>
  );
}
