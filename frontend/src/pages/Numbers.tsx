import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, Upload, Plus, MoreVertical } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface PhoneNumber {
  id: string
  range: string
  country: string
  prefix: string
  number: string
  payout: number
  plan: string
  status: string
  lastActivityAt: string
}

export default function Numbers() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchNumbers()
  }, [page, search, country, status])

  const fetchNumbers = async () => {
    try {
      const response = await api.get('/numbers', {
        params: { page, search, country, status }
      })
      setNumbers(response.data.numbers)
    } catch (error) {
      toast.error('Failed to load numbers')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast.success('Exporting numbers to CSV (DEMO MODE)')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 h-96 skeleton" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Number Manager</h1>
          <p className="text-gray-400">Manage your SMS numbers</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Number
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search numbers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Countries</option>
            <option value="Sri Lanka">Sri Lanka</option>
            <option value="India">India</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Bangladesh">Bangladesh</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-luxury-border">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Range</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Country</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Prefix</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Number</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Payout</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Last Activity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((number) => (
                <tr key={number.id} className="table-row border-b border-luxury-border/50">
                  <td className="p-4 text-sm text-white">{number.range}</td>
                  <td className="p-4 text-sm text-white">{number.country}</td>
                  <td className="p-4 text-sm text-white">{number.prefix}</td>
                  <td className="p-4 text-sm text-white font-mono">{number.number}</td>
                  <td className="p-4 text-sm text-white">${number.payout.toFixed(3)}</td>
                  <td className="p-4 text-sm text-white">{number.plan}</td>
                  <td className="p-4">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${number.status === 'ACTIVE' ? 'bg-luxury-success/20 text-luxury-success' :
                        number.status === 'INACTIVE' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-luxury-error/20 text-luxury-error'}
                    `}>
                      {number.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(number.lastActivityAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-luxury-accent/20 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-luxury-border">
          <p className="text-sm text-gray-400">
            Showing {numbers.length} numbers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg bg-luxury-card border border-luxury-border text-sm
                hover:bg-luxury-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded-lg bg-luxury-card border border-luxury-border text-sm
                hover:bg-luxury-accent/20"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
