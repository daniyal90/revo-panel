"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  MessageSquare,
  DollarSign,
  Clock,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Settings,
  User,
  LogOut,
  BarChart3,
  Activity,
  Zap,
  Globe,
  Shield,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from 'next-auth/react';
import useSocket from '@/hooks/useSocket';

const initialStats = { totalTraffic: 0, deliveredSms: 0, netEarnings: 0, pendingPayouts: 0 };

// will be loaded from APIs
const initialRanges: any[] = [];
const initialIntegration = { httpEndpoint: '', apiKey: '', smpp: { host: '', port: 0, systemId: '', password: '' } };

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [profileName, setProfileName] = useState<string>(session?.user?.name || 'John Doe');
  const [profileEmail, setProfileEmail] = useState<string>(session?.user?.email || 'john@example.com');
  const [profileWhatsapp, setProfileWhatsapp] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const userRole = (session as any)?.user?.role || 'User';
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [claimedRange, setClaimedRange] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [ranges, setRanges] = useState(initialRanges);
  const [integration, setIntegration] = useState(initialIntegration);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('USDT_TRC20');
  const [ltcAddress, setLtcAddress] = useState<string>('');
  const [usdtAddress, setUsdtAddress] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // connect to realtime socket for dashboard updates
  const socketRef = useSocket('dashboard');

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const onStats = (data: any) => setStats((prev) => ({ ...prev, ...data }));
    const onNewPayout = (p: any) => setPayouts((prev) => [p, ...prev]);
    socket.on('stats:update', onStats);
    socket.on('payout:new', onNewPayout);
    return () => {
      socket.off('stats:update', onStats);
      socket.off('payout:new', onNewPayout);
    };
  }, [socketRef]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClaimRange = async (rangeId: string) => {
    setClaimedRange(rangeId as any);
    try {
      const res = await fetch('/api/dashboard/ranges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Claim failed');
      // update local ranges
      setRanges((prev) => prev.map((r: any) => (r.id === rangeId ? { ...r, isClaimed: true, userId: json.data.userId } : r)));
      setToast({ type: 'success', message: 'Range claimed successfully' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Claim failed' });
      setClaimedRange(null);
    } finally {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredRanges = ranges.filter(
    (range: any) =>
      range.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      range.prefix.includes(searchTerm) ||
      String(range.range || '').includes(searchTerm)
  );

  // payouts handlers
  const loadPayouts = async () => {
    try {
      const res = await fetch('/api/dashboard/payouts');
      if (!res.ok) return;
      const json = await res.json();
      setPayouts(json.data || []);
      if (typeof json.availableBalance !== 'undefined') setAvailableBalance(Number(json.availableBalance || 0));
    } catch (e) {}
  };

  const submitPayout = async (amount: number, method: string, details?: any) => {
    try {
      setFormError(null);
      const res = await fetch('/api/dashboard/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, details }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Payout request failed');
      setToast({ type: 'success', message: 'Payout request submitted' });
      await loadPayouts();
    } catch (err: any) {
      setFormError(err?.message || 'Payout request failed');
      setToast({ type: 'error', message: err?.message || 'Payout request failed' });
    } finally {
      setTimeout(() => setToast(null), 4000);
    }
  };

  // load live data: balance/stats, ranges, and integration info
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [bRes, rRes, iRes] = await Promise.all([
          fetch('/api/user/balance'),
          fetch('/api/dashboard/ranges'),
          fetch('/api/dashboard/integration'),
        ]);

        if (bRes.ok) {
          const json = await bRes.json();
          if (mounted) setStats(prev => ({ ...prev, netEarnings: json.data.balance, deliveredSms: json.data.dailyCount }));
        }

        if (rRes.ok) {
          const rangesJson = await rRes.json();
          if (mounted) setRanges(rangesJson);
        }

        if (iRes.ok) {
          const iJson = await iRes.json();
          if (mounted) setIntegration(iJson);
        }
        // load payouts list
        if (mounted) await loadPayouts();
      } catch (e) {
        // ignore
      }
    }

    load();
    const int = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(int);
    };
  }, []);

  // keep local profileName in sync when session loads
  useEffect(() => {
    if (session?.user?.name) setProfileName(session.user.name);
    if (session?.user?.email) setProfileEmail(session.user.email);

    // fetch stored profile details (whatsapp, etc)
    (async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data) {
          setProfileWhatsapp('');
        }
      } catch (e) {}
    })();
  }, [session]);

  // show lightweight fallback while session initializes
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-slate-400">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Dashboard Header */}
      <header className="bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Revo Panel</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setShowSettingsModal((v) => !v)} className="text-slate-300 hover:text-white transition">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-white text-sm">{profileName}</span>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-slate-400 hover:text-red-400 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal (simple) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">User Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400">Close</button>
            </div>
            <div className="space-y-3 text-slate-400">
              <div>
                <strong className="text-white">{profileName}</strong>
                <div className="text-slate-400 text-sm">{userRole}</div>
              </div>
              <div>Email: {profileEmail}</div>
            </div>
            <form className="space-y-4" onSubmit={async (e) => { e.preventDefault();
                // save profile
                setSavingProfile(true);
                try {
                  const res = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: profileName, currentPassword, newPassword }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json?.error || 'Failed to update');
                  setToast({ type: 'success', message: 'Profile updated' });
                  setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                } catch (err: any) {
                  setToast({ type: 'error', message: err?.message || 'Update failed' });
                } finally {
                  setSavingProfile(false);
                  setTimeout(() => setToast(null), 3000);
                }
              }}>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Full Name</label>
                <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Email</label>
                <input value={profileEmail} disabled className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-400" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">WhatsApp / Telegram</label>
                <input value={profileWhatsapp} onChange={(e) => setProfileWhatsapp(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Confirm New Password</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="px-4 py-2 rounded bg-slate-700 text-white">Cancel</button>
                <button type="submit" disabled={savingProfile} className="px-4 py-2 rounded bg-blue-600 text-white">{savingProfile ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-6 z-50 p-4 rounded-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {toast.message}
          </div>
        )}
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1 mb-8">
          {["overview", "ranges", "integration", "financials"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition",
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+12.5%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stats.totalTraffic?.toLocaleString?.() ?? '0'}</h3>
                <p className="text-slate-400 text-sm">Total Traffic</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">96.3%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stats.deliveredSms?.toLocaleString?.() ?? '0'}</h3>
                <p className="text-slate-400 text-sm">Delivered SMS</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+8.2%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">${Number(stats.netEarnings || 0).toFixed(2)}</h3>
                <p className="text-slate-400 text-sm">Net Earnings</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <span className="text-yellow-400 text-sm font-medium">Pending</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">${Number(stats.pendingPayouts || 0).toFixed(2)}</h3>
                <p className="text-slate-400 text-sm">Pending Payouts</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>Recent Activity</span>
              </h2>
              <div className="space-y-4">
                {[
                  { type: "Traffic", message: "1,250 SMS delivered to UK ranges", time: "2 min ago", status: "success" },
                  { type: "Earning", message: "$45.00 credited to wallet", time: "15 min ago", status: "success" },
                  { type: "Range", message: "New range claimed: Germany +49", time: "1 hour ago", status: "info" },
                  { type: "Traffic", message: "890 SMS delivered to France ranges", time: "2 hours ago", status: "success" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center space-x-4">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          activity.status === "success" ? "bg-green-500" : "bg-blue-500"
                        )}
                      />
                      <div>
                        <p className="text-white font-medium">{activity.message}</p>
                        <p className="text-slate-400 text-sm">{activity.time}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        activity.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      )}
                    >
                      {activity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Ranges Tab */}
        {activeTab === "ranges" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span>Active Ranges & Rates</span>
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ranges..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-800">
                      <th className="pb-3 font-medium">Country</th>
                      <th className="pb-3 font-medium">Prefix</th>
                      <th className="pb-3 font-medium">Range</th>
                      <th className="pb-3 font-medium">Rate/SMS</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRanges.map((range: any) => (
                      <tr key={range.id} className="border-b border-slate-800/50">
                        <td className="py-4 text-white">{range.country}</td>
                        <td className="py-4 text-slate-300">{range.prefix}</td>
                        <td className="py-4 text-slate-300">{range.range}</td>
                        <td className="py-4 text-green-400 font-semibold">${Number(range.rate).toFixed(3)}</td>
                        <td className="py-4">
                          <span
                            className={cn(
                              "inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium",
                              range.status === "Live"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            )}
                          >
                            <span className="w-2 h-2 rounded-full bg-current" />
                            <span>{range.status}</span>
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleClaimRange(range.id)}
                            disabled={claimedRange === range.id}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2",
                              claimedRange === range.id
                                ? "bg-green-600 text-white cursor-default"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                          >
                            {claimedRange === range.id ? (
                              <>
                                <span>Claimed!</span>
                              </>
                            ) : (
                              <>
                                <span>Claim Range</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Integration Tab */}
        {activeTab === "integration" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* HTTP API */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>HTTP API Integration</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">API Endpoint</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.httpEndpoint}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(integration.httpEndpoint, "endpoint")}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition"
                    >
                      {copied === "endpoint" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">API Key</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.apiKey}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(integration.apiKey, "apikey")}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition"
                    >
                      {copied === "apikey" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SMPP Configuration */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>SMPP 3.4 Configuration</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Host</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.smpp.host}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(integration.smpp.host, "host")}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition"
                    >
                      {copied === "host" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Port</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.smpp.port}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(String(integration.smpp.port), "port")}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition"
                    >
                      {copied === "port" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">System ID</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={integration.smpp.systemId}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(integration.smpp.systemId, "systemid")}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition"
                    >
                      {copied === "systemid" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Password</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value="************"
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Financials Tab */}
        {activeTab === "financials" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Payout Progress */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                <span>Payout Progress</span>
              </h2>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Minimum Payout Threshold</span>
                  <span className="text-white font-semibold">$50.00</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((Number(stats.pendingPayouts || 0)) / 50) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400 text-sm">Current: ${Number(stats.pendingPayouts || 0).toFixed(2)}</span>
                  <span className="text-green-400 text-sm font-medium">
                    {(((Number(stats.pendingPayouts || 0)) / 50) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              {Number(stats.pendingPayouts || 0) >= 50 && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 font-medium">✓ You've reached the minimum payout threshold!</p>
                  <p className="text-slate-400 text-sm mt-1">Your payout will be processed on Tuesday.</p>
                </div>
              )}
            </div>

            {/* Request Withdrawal (only in Financials) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Request Withdrawal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-slate-400 text-sm mb-2">Available Balance</label>
                  <div className="text-white font-mono text-lg">${availableBalance.toFixed(2)}</div>
                  {availableBalance < 50 && (
                    <div className="text-yellow-400 text-sm mt-2">Minimum payout is $50. You need more balance to request a payout.</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-sm mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={payoutAmount as any}
                    onChange={(e) => setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                  />
                  <div className="mt-3">
                    <label className="block text-slate-400 text-sm mb-2">Method</label>
                    <div className="flex items-center space-x-4">
                      {[
                        { value: 'USDT_TRC20', label: 'USDT-TRC20' },
                        { value: 'LITECOIN', label: 'Litecoin (LTC)' },
                        { value: 'WISE', label: 'Wise' },
                        { value: 'BANK_WIRE', label: 'Bank Wire' },
                      ].map((m) => (
                        <label key={m.value} className="inline-flex items-center space-x-2">
                          <input type="radio" name="payoutMethod" value={m.value} checked={payoutMethod === m.value} onChange={() => setPayoutMethod(m.value)} className="form-radio" />
                          <span className="text-slate-300">{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {payoutMethod === 'LITECOIN' && (
                    <div className="mt-4">
                      <label className="block text-slate-400 text-sm mb-2">Litecoin Address (LTC)</label>
                      <input value={ltcAddress} onChange={(e) => setLtcAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm" />
                    </div>
                  )}

                  {payoutMethod === 'USDT_TRC20' && (
                    <div className="mt-4">
                      <label className="block text-slate-400 text-sm mb-2">USDT Wallet Address (TRC20)</label>
                      <input value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm" />
                      <p className="text-slate-500 text-xs mt-2">TRC20 address must start with 'T' and be 34 characters long.</p>
                    </div>
                  )}

                  {formError && <div className="text-red-400 text-sm mt-2">{formError}</div>}

                  <div className="mt-4">
                    <button
                    disabled={
                      availableBalance < 50 || !payoutAmount || Number(payoutAmount) < 50 ||
                      (payoutMethod === 'LITECOIN' && !ltcAddress) ||
                      (payoutMethod === 'USDT_TRC20' && !usdtAddress)
                    }
                      onClick={async () => {
                        // client-side validations
                        if (!payoutAmount || Number(payoutAmount) < 50) {
                          setFormError('Amount must be at least $50');
                          return;
                        }
                        if (Number(payoutAmount) > availableBalance) {
                          setFormError('Amount exceeds available balance');
                          return;
                        }
                        if (payoutMethod === 'LITECOIN' && !ltcAddress) {
                          setFormError('Litecoin address is required');
                          return;
                        }
                        if (payoutMethod === 'USDT_TRC20') {
                          const trc20 = /^T[a-zA-Z0-9]{33}$/;
                          if (!usdtAddress) {
                            setFormError('USDT TRC20 address is required');
                            return;
                          }
                          if (!trc20.test(usdtAddress)) {
                            setFormError('Invalid TRC20 address');
                            return;
                          }
                        }
                        setFormError(null);
                        const details = payoutMethod === 'LITECOIN' ? { address: ltcAddress } : payoutMethod === 'USDT_TRC20' ? { address: usdtAddress } : undefined;
                        await submitPayout(Number(payoutAmount), payoutMethod, details);
                        // clear
                        setPayoutAmount('');
                        setLtcAddress('');
                        setUsdtAddress('');
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition',
                        availableBalance < 50 || !payoutAmount || Number(payoutAmount) < 50
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      )}
                    >
                      Request Payout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Methods */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Withdrawal Methods</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { method: "USDT-TRC20", icon: "₮", status: "Active" },
                  { method: "Wise", icon: "W", status: "Not Configured" },
                  { method: "Bank Wire", icon: "🏦", status: "Not Configured" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">
                        {item.icon}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          item.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-500/20 text-slate-400"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-white font-medium">{item.method}</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {item.status === "Active" ? "Configured and ready" : "Click to configure"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout History */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Payout History</h2>
                <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="space-y-4">
                {payouts.length === 0 && (
                  <div className="text-slate-400">No payout requests yet.</div>
                )}
                {payouts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-white font-medium">${Number(p.amount).toFixed(2)}</div>
                      <div className="text-slate-400 text-sm">{p.method}</div>
                    </div>
                    <div className="text-slate-400 text-sm">{new Date(p.createdAt).toLocaleDateString()}</div>
                    <div className={cn('font-medium', p.status === 'PENDING' ? 'text-yellow-400' : p.status === 'SENT' || p.status === 'APPROVED' ? 'text-green-400' : 'text-red-400')}>{p.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
