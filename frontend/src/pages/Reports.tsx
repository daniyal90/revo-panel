import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Copy, BarChart3, TrendingUp, DollarSign } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Reports() {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    range: '',
    number: '',
    status: '',
    groupBy: 'day',
  })

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await api.post('/reports/generate', filters)
      setReportData(response.data)
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      await api.post('/reports/export', { format, reportData })
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b']

  const demoData = {
    summary: {
      totalSms: 58234,
      successful: 54892,
      failed: 3342,
      pending: 0,
      totalEarnings: 1048.21,
      averagePayout: 0.018,
      successRate: 94.3,
    },
    data: [
      { date: '2026-09-19', volume: 8427, successful: 7891, failed: 536, earnings: 151.69 },
      { date: '2026-09-18', volume: 8156, successful: 7692, failed: 464, earnings: 146.45 },
      { date: '2026-09-17', volume: 8234, successful: 7756, failed: 478, earnings: 148.21 },
      { date: '2026-09-16', volume: 7892, successful: 7434, failed: 458, earnings: 142.06 },
      { date: '2026-09-15', volume: 8101, successful: 7623, failed: 478, earnings: 145.82 },
      { date: '2026-09-14', volume: 8420, successful: 7934, failed: 486, earnings: 151.56 },
      { date: '2026-09-13', volume: 8004, successful: 7562, failed: 442, earnings: 144.07 },
    ],
  }

  const data = reportData || demoData

  const pieData = [
    { name: 'Successful', value: data.summary.successful },
    { name: 'Failed', value: data.summary.failed },
    { name: 'Pending', value: data.summary.pending },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Reports</h1>
        <p className="text-gray-400">Generate and export detailed reports</p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Range</label>
            <input
              type="text"
              value={filters.range}
              onChange={(e) => setFilters({ ...filters, range: e.target.value })}
              className="input-field"
              placeholder="All ranges"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number</label>
            <input
              type="text"
              value={filters.number}
              onChange={(e) => setFilters({ ...filters, number: e.target.value })}
              className="input-field"
              placeholder="All numbers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Group By</label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="input-field"
            >
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Generating...' : 'Show Report'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export XLSX
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
              toast.success('Report copied to clipboard')
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-luxury-accent/20">
              <BarChart3 className="w-6 h-6 text-luxury-accent" />
            </div>
            <h3 className="text-gray-400 text-sm">Total SMS</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.summary.totalSms.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-luxury-success/20">
              <TrendingUp className="w-6 h-6 text-luxury-success" />
            </div>
            <h3 className="text-gray-400 text-sm">Success Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.summary.successRate}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-luxury-purple/20">
              <DollarSign className="w-6 h-6 text-luxury-purple" />
            </div>
            <h3 className="text-gray-400 text-sm">Total Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-white">${data.summary.totalEarnings.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-luxury-blue/20">
              <BarChart3 className="w-6 h-6 text-luxury-blue" />
            </div>
            <h3 className="text-gray-400 text-sm">Avg Payout</h3>
          </div>
          <p className="text-3xl font-bold text-white">${data.summary.averagePayout.toFixed(3)}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">SMS Volume</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.data}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 30, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#6366f1" fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Status Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 30, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
