"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [ranges, setRanges] = useState<any[]>([]);

  const loadUsers = async () => {
    // request pending users using legacy query param; backend maps this to isActive=false
    const res = await fetch('/api/admin/users?status=PENDING');
    if (!res.ok) return;
    const json = await res.json();
    setUsers(json.data || []);
  };

  const loadPayouts = async () => {
    const res = await fetch('/api/admin/payouts?status=PENDING');
    if (!res.ok) return;
    const json = await res.json();
    setPayouts(json.data || []);
  };

  const loadRanges = async () => {
    const res = await fetch('/api/ranges');
    if (!res.ok) return;
    const json = await res.json();
    setRanges(json.data || []);
  };

  useEffect(() => {
    loadUsers();
    loadPayouts();
    loadRanges();
  }, []);

  const approveUser = async (userId: string) => {
    await fetch('/api/admin/users/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'APPROVE' }) });
    await loadUsers();
  };

  const rejectUser = async (userId: string) => {
    await fetch('/api/admin/users/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'REJECT' }) });
    await loadUsers();
  };

  const approvePayout = async (payoutId: string) => {
    await fetch('/api/admin/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId, action: 'APPROVE' }) });
    await loadPayouts();
  };

  const rejectPayout = async (payoutId: string) => {
    await fetch('/api/admin/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId, action: 'REJECT' }) });
    await loadPayouts();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <div className="flex space-x-2 mb-6">
          <button onClick={() => setTab('users')} className={cn('px-4 py-2 rounded', tab === 'users' ? 'bg-blue-600' : 'bg-slate-800')}>User Approvals</button>
          <button onClick={() => setTab('payouts')} className={cn('px-4 py-2 rounded', tab === 'payouts' ? 'bg-blue-600' : 'bg-slate-800')}>Payouts</button>
          <button onClick={() => setTab('ranges')} className={cn('px-4 py-2 rounded', tab === 'ranges' ? 'bg-blue-600' : 'bg-slate-800')}>System Ranges</button>
        </div>

        {tab === 'users' && (
          <div className="bg-slate-900 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Pending Users</h2>
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-slate-400">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Signed Up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-800">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      <button onClick={() => approveUser(u.id)} className="bg-green-600 px-3 py-1 rounded mr-2">Approve</button>
                      <button onClick={() => rejectUser(u.id)} className="bg-red-600 px-3 py-1 rounded">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="bg-slate-900 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Pending Payout Requests</h2>
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-slate-400">
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800">
                    <td className="py-2">{p.user?.email}</td>
                    <td className="py-2">${Number(p.amount).toFixed(2)}</td>
                    <td className="py-2">{p.method}</td>
                    <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      <button onClick={() => approvePayout(p.id)} className="bg-green-600 px-3 py-1 rounded mr-2">Approve</button>
                      <button onClick={() => rejectPayout(p.id)} className="bg-red-600 px-3 py-1 rounded">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'ranges' && (
          <div className="bg-slate-900 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">System Number Ranges</h2>
            <div className="space-y-4">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th>Destination</th>
                    <th>Carrier</th>
                    <th>Prefix</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((r) => (
                    <tr key={r.id} className="border-t border-slate-800">
                      <td className="py-2">{r.destination}</td>
                      <td className="py-2">{r.carrierCode}</td>
                      <td className="py-2">{r.prefix}</td>
                      <td className="py-2">${Number(r.rate).toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
