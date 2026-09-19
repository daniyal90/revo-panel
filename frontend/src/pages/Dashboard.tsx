import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Wallet
} from 'lucide-react'
import StatCard from '../components/StatCard'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [trafficData, setTrafficData] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('24H')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchTraffic(selectedPeriod)
  }, [selectedPeriod])

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const fetchTraffic = async (period: string) => {
    try {
      const response = await api.get('/dashboard/traffic', { params: { period } })
      setTrafficData(response.data.data || [])
    } catch (error) {
      console.error('Failed to load traffic data')
    }
  }

  const periods = ['1H', '6H', '24H', '7D', '30D']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400">Overview of your SMS operations</p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedPeriod === period
                  ? 'bg-luxury-accent text-white shadow-glow'
                  : 'text-gray-400 hover:text-white hover:bg-luxury-accent/20'
                }
              `}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Numbers"
          value={stats?.totalNumbers || 0}
          icon={Phone}
          trend={5.2}
        />
        <StatCard
          title="Active Numbers"
          value={stats?.activeNumbers || 0}
          icon={Activity}
          trend={3.8}
        />
        <StatCard
          title="SMS Today"
          value={stats?.smsToday?.toLocaleString() || 0}
          icon={MessageSquare}
          trend={12.5}
        />
        <StatCard
          title="SMS This Week"
          value={stats?.smsThisWeek?.toLocaleString() || 0}
          icon={TrendingUp}
          trend={8.3}
        />
        <StatCard
          title="Successful SMS"
          value={stats?.successfulSms?.toLocaleString() || 0}
          icon={CheckCircle}
          trend={15.2}
        />
        <StatCard
          title="Failed SMS"
          value={stats?.failedSms?.toLocaleString() || 0}
          icon={XCircle}
          trend={-2.1}
        />
        <StatCard
          title="Today's Earnings"
          value={`$${stats?.todaysEarnings?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          trend={18.7}
        />
        <StatCard
          title="Available Balance"
          value={`$${stats?.availableBalance?.toFixed(2) || '0.00'}`}
          icon={Wallet}
        />
      </div>

      {/* Traffic Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Traffic Monitor</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#9ca3af"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 30, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
              <Line
                type="monotone"
                dataKey="successful"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-luxury-accent" />
            <span className="text-sm text-gray-400">Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-luxury-success" />
            <span className="text-sm text-gray-400">Successful</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-luxury-error" />
            <span className="text-sm text-gray-400">Failed</span>
          </div>
        </div>
      </motion.div>

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Connection Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats?.connectionStatus || {}).map(([key, value]: [string, any]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border"
            >
              <div className={`
                status-dot ${value === 'CONNECTED' ? 'status-connected' : 
                           value === 'DISCONNECTED' ? 'status-disconnected' : 
                           'status-reconnecting'}
              `} />
              <div>
                <p className="text-sm font-medium text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-xs text-gray-400">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
