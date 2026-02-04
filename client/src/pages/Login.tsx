import React, { useState, useEffect } from 'react';
import { RotateCcw, Ghost, Mail, ArrowRight, Check, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { NeonInput, NeonButton } from '../components/Common';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError(null);
  }, [email]);

  // Email validation regex
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signInWithMagicLink(email);
      setSuccess('Magic Link sent! Check your email inbox to continue.');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to send login link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    if (!isLogin && !agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to initialize Google login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden pb-20">
      {/* Background Animations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon opacity-10 blur-[150px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600 opacity-10 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 z-20 transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-md z-10 bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl my-auto animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-neon-sm">
            <Ghost className="w-8 h-8 text-neon" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
            {isLogin ? (
              <>Welcome <span className="text-neon">Back</span></>
            ) : (
              <>Create <span className="text-neon">Account</span></>
            )}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Sign in to find your Othrhalff.' : 'Join the exclusive student network.'}
          </p>
        </div>

        {/* Toast Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300 flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleLogin}
            disabled={(!isLogin && !agreedToTerms) || isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isLogin ? 'Continue with Google' : 'Sign up with Google'}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] bg-gray-800 flex-1"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Or Email</span>
          <div className="h-[1px] bg-gray-800 flex-1"></div>
        </div>

        <form onSubmit={handleEmailContinue} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <NeonInput
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="pl-12"
            />
          </div>

          {/* Mandatory Checkbox for Signup */}
          {!isLogin && (
            <div className="flex items-start gap-3 px-1 animate-fade-in">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={isLoading}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-900 transition-all checked:border-neon checked:bg-neon hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-neon/50"
                />
                <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
              </div>
              <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed cursor-pointer select-none">
                I agree to the <Link to="/terms" target="_blank" className="text-neon hover:underline">Terms of Service</Link>, <Link to="/privacy" target="_blank" className="text-neon hover:underline">Privacy Policy</Link>, and acknowledge I am a current university student.
              </label>
            </div>
          )}

          <NeonButton
            disabled={(!isLogin && !agreedToTerms) || isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Continue' : 'Create Account'} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </NeonButton>
        </form>

        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-gray-400">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setIsLogin(false); setAgreedToTerms(false); }}
                  className="text-neon font-bold hover:underline"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-neon font-bold hover:underline"
                  disabled={isLoading}
                >
                  Log in
                </button>
              </>
            )}
          </div>

          {isLogin && (
            <p className="text-[10px] text-gray-600 max-w-xs mx-auto">
              By logging in, you agree to our Terms & Conditions and Privacy Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};