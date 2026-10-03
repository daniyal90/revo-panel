"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Reset token is missing');
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return setError('Token missing');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
      <div className="w-full max-w-md bg-[#161b22] border border-slate-800 rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-2">Reset your password</h1>
        <p className="text-sm text-slate-400 mb-4">Enter a new password for your account.</p>
        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
        {success && <div className="mb-3 text-sm text-green-400">Password updated. Redirecting to login...</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 block mb-1">New Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full rounded-md bg-[#0d1117] border border-slate-800 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1">Confirm Password</label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" className="w-full rounded-md bg-[#0d1117] border border-slate-800 px-3 py-2 text-white" />
          </div>
          <div className="flex items-center justify-between">
            <button disabled={loading || success} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-60">{loading ? 'Updating...' : 'Update Password'}</button>
            <a href="/login" className="text-sm text-slate-400 hover:text-white">Back to login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
