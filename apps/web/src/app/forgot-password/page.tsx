'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email },
      });
      setMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setToken(res.resetToken);
        setStep('reset');
      } else {
        setStep('reset');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: { token, newPassword },
      });
      setMessage('Password updated. You can sign in now.');
      setStep('request');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 15% 10%, rgba(12,107,69,0.18), transparent 42%), linear-gradient(165deg, #04101f 0%, #081a30 55%, #0a241c 100%)',
        }}
      />
      <Card className="relative z-10 w-full max-w-md animate-scale-in border-white/10 bg-white/96 shadow-lift">
        <CardHeader>
          <CardTitle className="text-2xl text-navy dark:text-foreground">Reset password</CardTitle>
          <CardDescription>
            {step === 'request'
              ? 'Request a reset token for your official account email.'
              : 'Enter token and choose a new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <form className="space-y-4" onSubmit={requestReset}>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <p className="text-sm text-red-700">{error}</p>}
              {message && <p className="text-sm text-accent-700">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Request reset'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={resetPassword}>
              <Input placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} required />
              {resetToken && (
                <p className="rounded-md bg-muted p-2 font-mono text-[11px] break-all">Dev token: {resetToken}</p>
              )}
              <Input
                type="password"
                placeholder="New password (min 10)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={10}
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              {message && <p className="text-sm text-accent-700">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm">
            <Link className="text-accent underline-offset-2 hover:underline" href="/login">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
