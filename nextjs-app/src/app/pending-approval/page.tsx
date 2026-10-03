"use client";

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="max-w-xl p-8 bg-slate-900/50 border border-slate-800 rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-slate-300 mb-6">Your account is awaiting admin approval. You will be notified by email once your account has been approved.</p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/" className="px-4 py-2 bg-slate-800 rounded">Return to Home</Link>
          <Link href="/login" className="px-4 py-2 bg-blue-600 rounded text-white">Login</Link>
        </div>
      </div>
    </div>
  );
}
