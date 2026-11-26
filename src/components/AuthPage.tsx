import React, { useEffect, useState } from 'react';
import { ChevronDown, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY } from '../data/catalog';
import { api, AuthStatus, AuthUser } from '../lib/api';

export type AuthTab = 'login' | 'signup' | 'admin';

interface AuthPageProps {
  initialTab?: AuthTab;
  onAuthSuccess: (user: AuthUser, token: string, redirectToAdmin?: boolean) => void;
  onBackHome: () => void;
  onOpenInfoPage?: (pageKey: string) => void;
}

export function AuthPage({
  initialTab = 'login',
  onAuthSuccess,
  onOpenInfoPage,
}: AuthPageProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(initialTab === 'admin');
  const [showLostPasswordNote, setShowLostPasswordNote] = useState(false);

  // Separate error & loading feedback per column so Login and Register work cleanly side-by-side
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Login column fields (Matches reference screenshot)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register column fields (Matches reference screenshot + password so account activates immediately)
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Admin setup / login fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirm, setAdminConfirm] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(() => {
    setShowAdminPanel(initialTab === 'admin');
    setLoginError(null);
    setRegisterError(null);
    setAdminError(null);
  }, [initialTab]);

  useEffect(() => {
    api
      .getAuthStatus()
      .then((status) => setAuthStatus(status))
      .catch(() => {
        setAuthStatus({ hasAdminAccount: false, hasEnvPasscode: false, needsAdminSetup: true });
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const { user, token } = await api.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      onAuthSuccess(user, token, user.role === 'admin');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters.');
      return;
    }
    setRegisterLoading(true);
    try {
      const { user, token } = await api.signup({
        name: regFirstName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        city: 'Lahore',
        password: regPassword,
      });
      onAuthSuccess(user, token, false);
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleAdminClaimSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (adminPassword.length < 8) {
      setAdminError('Admin password must be at least 8 characters.');
      return;
    }
    if (adminPassword !== adminConfirm) {
      setAdminError('Admin passwords do not match.');
      return;
    }
    setAdminLoading(true);
    try {
      const { user, token } = await api.adminSetup({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      });
      onAuthSuccess(user, token, true);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to claim admin account.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);
    try {
      const { user, token } = await api.adminPasscodeLogin(adminPasscode);
      onAuthSuccess(user, token, true);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Invalid admin passcode.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);
    try {
      const { user, token } = await api.login({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (user.role !== 'admin') {
        setAdminError('This account is a customer account, not an Admin account.');
        setAdminLoading(false);
        return;
      }
      onAuthSuccess(user, token, true);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Admin login failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="bg-white py-10 sm:py-14 lg:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Classic Two-Column Login & Register Layout (Matches user reference screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* LEFT COLUMN: LOGIN */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Login</h1>

            {loginError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="rooznam-login-email"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  Username or email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="rooznam-login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="rooznam-login-password"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="rooznam-login-password"
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-11 px-3.5 pr-10 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    aria-label="Toggle login password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-xs border-gray-300 accent-[#6a0dad]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="px-6 py-2.5 rounded-md bg-[#6a0dad] hover:bg-[#520d75] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {loginLoading ? 'Logging in...' : 'Log in'}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowLostPasswordNote((prev) => !prev)}
                  className="text-xs sm:text-[13px] text-[#6a0dad] hover:underline cursor-pointer"
                >
                  Lost your password?
                </button>

                {showLostPasswordNote && (
                  <p className="mt-2.5 p-3 rounded-md bg-[#faf5fd] border border-purple-100 text-xs text-gray-600 leading-relaxed">
                    Need help resetting your Rooznam account password? Message our parent support
                    team on WhatsApp at{' '}
                    <a
                      href={buildWhatsAppUrl(
                        'Assalam-o-Alaikum Rooznam! I need help resetting my account password.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#6a0dad] underline"
                    >
                      {WHATSAPP_DISPLAY}
                    </a>{' '}
                    and we will assist right away.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: REGISTER */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Register</h2>

            {registerError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  htmlFor="rooznam-reg-email"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="rooznam-reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                />
              </div>

              <p className="text-xs sm:text-[13px] text-gray-700">
                A confirmation &amp; account welcome note will be linked to your email address.
              </p>

              <div>
                <label
                  htmlFor="rooznam-reg-name"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="rooznam-reg-name"
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="rooznam-reg-phone"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="rooznam-reg-phone"
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="rooznam-reg-password"
                  className="block text-xs sm:text-[13px] text-gray-700 mb-1.5"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="rooznam-reg-password"
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 px-3.5 pr-10 border border-gray-200 rounded-xs bg-white text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass((v) => !v)}
                    aria-label="Toggle register password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed pt-1">
                Your personal data will be used to support your experience throughout this website,
                to manage access to your account, and for other purposes described in our{' '}
                <button
                  type="button"
                  onClick={() => onOpenInfoPage?.('privacy')}
                  className="text-[#6a0dad] hover:underline cursor-pointer"
                >
                  privacy policy
                </button>
                .
              </p>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-6 py-2.5 rounded-md bg-[#6a0dad] hover:bg-[#520d75] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {registerLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Clean Collapsible Store Owner / Admin Dashboard Portal */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowAdminPanel((prev) => !prev)}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg bg-[#faf5fd] hover:bg-purple-100/70 border border-purple-100 text-xs font-bold text-[#38035e] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6a0dad]" />
              <span>Store Owner? Admin Dashboard Setup &amp; Login</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#6a0dad] transition-transform duration-200 ${
                showAdminPanel ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showAdminPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="mt-5 max-w-xl rounded-2xl border border-purple-100 bg-[#faf8fc] p-5 sm:p-6 space-y-4">
                  {adminError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      {adminError}
                    </div>
                  )}

                  {authStatus?.needsAdminSetup ? (
                    <form onSubmit={handleAdminClaimSetup} className="space-y-4">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#d91b7e]">
                          First-Time Store Owner Setup
                        </p>
                        <h3 className="text-base font-extrabold text-[#38035e] mt-0.5">
                          Claim Your Rooznam Admin Account
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Create your store owner login once to unlock the full Admin Dashboard.
                          After setup completes, this claim form locks automatically.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Owner Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            placeholder="e.g. Store Owner"
                            className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Admin Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="ahmadmail59268@gmail.com"
                            className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Admin Password (min 8 chars) *
                          </label>
                          <div className="relative">
                            <input
                              type={showAdminPass ? 'text' : 'password'}
                              required
                              minLength={8}
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="Create strong password"
                              className="w-full h-10 px-3 pr-9 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPass((v) => !v)}
                              aria-label="Toggle admin password visibility"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                              {showAdminPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Confirm Password *
                          </label>
                          <input
                            type={showAdminPass ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={adminConfirm}
                            onChange={(e) => setAdminConfirm(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={adminLoading}
                        className="px-6 py-2.5 rounded-md bg-[#38035e] hover:bg-[#520d75] disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        {adminLoading
                          ? 'Setting up Admin Dashboard...'
                          : 'Create Admin & Open Dashboard'}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      {authStatus?.hasEnvPasscode && (
                        <form onSubmit={handleAdminPasscode} className="space-y-3">
                          <h3 className="text-sm font-extrabold text-[#38035e]">
                            Admin Passcode Sign In
                          </h3>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type={showAdminPass ? 'text' : 'password'}
                              required
                              value={adminPasscode}
                              onChange={(e) => setAdminPasscode(e.target.value)}
                              placeholder="Enter server admin passcode"
                              className="w-full h-10 pl-9 pr-9 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPass((v) => !v)}
                              aria-label="Toggle passcode visibility"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                              {showAdminPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <button
                            type="submit"
                            disabled={adminLoading}
                            className="px-5 py-2.5 rounded-md bg-[#38035e] hover:bg-[#520d75] text-white text-xs font-bold cursor-pointer"
                          >
                            {adminLoading ? 'Verifying...' : 'Unlock Admin Dashboard'}
                          </button>
                        </form>
                      )}

                      {authStatus?.hasAdminAccount && (
                        <form onSubmit={handleAdminEmailLogin} className="space-y-3">
                          <h3 className="text-sm font-extrabold text-[#38035e]">
                            Admin Account Sign In
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="email"
                              required
                              value={adminEmail}
                              onChange={(e) => setAdminEmail(e.target.value)}
                              placeholder="ahmadmail59268@gmail.com"
                              className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                            />
                            <input
                              type="password"
                              required
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="Admin password"
                              className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-[#6a0dad]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={adminLoading}
                            className="px-5 py-2.5 rounded-md bg-[#6a0dad] hover:bg-[#520d75] text-white text-xs font-bold cursor-pointer"
                          >
                            {adminLoading ? 'Signing in...' : 'Open Admin Dashboard'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
