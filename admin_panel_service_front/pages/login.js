import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, LogIn, ShieldCheck, Zap, BarChart3, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

const headingFont = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'] });
const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  if (user) {
    const dash = user.role === 'admin' ? '/admin/dashboard' : user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard';
    router.replace(dash);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      const dash = u.role === 'admin' ? '/admin/dashboard' : u.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard';
      router.push(dash);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${bodyFont.className} min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950`}>
      {/* Left: brand + value */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)]" />
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl float-slow" />
        <div className="absolute -bottom-36 -right-20 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl float-fast" />
        <div className="absolute inset-0">
          <Image src="/images/b.png" alt="marketing" fill style={{ objectFit: 'cover', opacity: 0.2 }} priority />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.18),transparent_50%)]" />

        <div className="relative z-10 max-w-xl p-12 text-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shadow-sm">
              <MessageCircle size={26} strokeWidth={2} className="text-amber-200" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-slate-300">WhatsApp Bulk</div>
              <div className={`${headingFont.className} text-3xl font-semibold`}>Campaigns that feel personal</div>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-md">
            Launch personalized broadcasts, manage client pipelines, and track outcomes with clarity and control.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm card-rise">
              <Zap size={18} className="text-amber-300 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Faster send flows</div>
                <div className="text-xs text-slate-300">Templates, approvals, and scheduling in minutes.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm card-rise delay-1">
              <BarChart3 size={18} className="text-emerald-300 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Live analytics</div>
                <div className="text-xs text-slate-300">Track delivery, clicks, and ROI by campaign.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm card-rise delay-2">
              <ShieldCheck size={18} className="text-sky-300 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Secure access</div>
                <div className="text-xs text-slate-300">Role-based logins and tokenized sessions.</div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-200" />
              <span>Smart segmentation</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span>99.9% delivery uptime</span>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="relative flex items-center justify-center bg-slate-50 p-6 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_40%,_#ffffff_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.22),transparent_45%)]" />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-7">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                <MessageCircle size={20} strokeWidth={2} />
              </div>
              <h2 className={`${headingFont.className} text-2xl font-semibold text-slate-900 m-0`}>Welcome back</h2>
            </div>
            <p className="text-sm text-slate-600">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl border border-slate-200/70 card-rise">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">{error}</div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-slate-300/80 rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition"
              />
            </div>

            <div className="mb-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-slate-300/80 rounded-xl text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-amber-500" />
                Remember me
              </label>
              <span className="hover:text-slate-700">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <LogIn size={18} strokeWidth={2} />
              {loading ? 'Signing in...' : 'Login'}
            </button>

            <div className="mt-5 text-xs text-slate-500 flex items-center justify-center gap-2">
              <span>New here?</span>
              <span className="text-slate-900 font-semibold inline-flex items-center gap-1">
                Request access
                <ArrowRight size={12} />
              </span>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .float-slow {
          animation: floatSlow 12s ease-in-out infinite;
        }
        .float-fast {
          animation: floatFast 9s ease-in-out infinite;
        }
        .card-rise {
          animation: riseIn 0.7s ease-out both;
        }
        .delay-1 {
          animation-delay: 0.12s;
        }
        .delay-2 {
          animation-delay: 0.24s;
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes floatFast {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes riseIn {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
