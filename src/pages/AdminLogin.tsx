/**
 * Admin Login Page
 *
 * Professional login page for administrative access
 * Matches the existing school branding and design system
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';

export function AdminLogin() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 1) {
      errors.password = 'Password must not be empty';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      // On successful login, redirect to admin photos
      window.location.pathname = '/admin/photos';
    } catch (err) {
      // Error is displayed via the error state
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-school-cream text-school-navy">
      {/* Background accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-96 w-96 bg-school-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 bg-school-navy/5 rounded-full blur-3xl" />
      </div>

      {/* Skip link */}
      <a href="/" className="school-skip-link">
        Skip to website
      </a>

      <main className="relative flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-school-navy/10">
                <Icon name="lock" className="h-8 w-8 text-school-navy" />
              </div>
            </div>
            <h1 className="font-serif text-3xl font-bold text-school-navy mb-2">
              Admin Access
            </h1>
            <p className="text-school-muted text-sm">
              Sign in to manage school content and photos
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-panel-light rounded-3xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Icon name="x" className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-red-800">
                      {error === 'Invalid credentials'
                        ? 'Invalid email or password. Please try again.'
                        : error}
                    </p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-school-navy mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: undefined });
                    }
                  }}
                  disabled={isLoading}
                  aria-invalid={Boolean(validationErrors.email)}
                  className="form-field"
                  autoComplete="email"
                  required
                />
                {validationErrors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-school-navy mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: undefined });
                    }
                  }}
                  disabled={isLoading}
                  aria-invalid={Boolean(validationErrors.password)}
                  className="form-field"
                  autoComplete="current-password"
                  required
                />
                {validationErrors.password && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 rounded-xl bg-school-navy text-school-cream px-6 py-3 font-semibold transition-all duration-200 hover:bg-school-navy-light focus-visible:outline-offset-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-school-cream/30 border-t-school-cream rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Icon name="arrow" className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Info Message */}
            <div className="mt-6 pt-6 border-t border-school-navy/10">
              <p className="text-xs text-school-muted text-center">
                Admin access only. Contact your administrator for credentials.
              </p>
            </div>
          </div>

          {/* Back to Website */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-school-navy hover:text-school-navy-light transition-colors"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Back to Website
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
