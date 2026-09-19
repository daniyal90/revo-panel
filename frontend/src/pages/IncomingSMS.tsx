import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Copy, RefreshCw } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface InboundMessage {
  id: string
  date: Date
  time: string
  range: string
  number: string
  cli: string
  message: string
  currency: string
  payout: number
  status: string
  createdAt: string
}

export default function IncomingSMS() {
  const [messages, setMessages] = useState<InboundMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [range, setRange] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchMessages()
  }, [page, search, country, range])

  const fetchMessages = async () => {
    try {
      const response = await api.get('/inbound', {
        params: { page, search, country, range }
      })
      setMessages(response.data.messages)
    } catch (error) {
      toast.error('Failed to load incoming messages')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const extractOTP = (message: string) => {
    const otpMatch = message.match(/\b\d{4,6}\b/)
    return otpMatch ? otpMatch[0] : null
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
          <h1 className="text-3xl font-bold text-white mb-1">Incoming SMS</h1>
          <p className="text-gray-400">View received SMS messages</p>
        </div>
        <button 
          onClick={fetchMessages}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
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
                placeholder="Search messages..."
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
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Ranges</option>
            <option value="Sri Lanka LX 14Aug">Sri Lanka LX 14Aug</option>
            <option value="India Vodafone">India Vodafone</option>
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
                <th className="text-left p-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Time</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Range</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Number</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">CLI</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Message</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Payout</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => {
                const otp = extractOTP(msg.message)
                return (
                  <tr key={msg.id} className="table-row border-b border-luxury-border/50">
                    <td className="p-4 text-sm text-white">
                      {new Date(msg.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-white">{msg.time}</td>
                    <td className="p-4 text-sm text-white">{msg.range}</td>
                    <td className="p-4 text-sm text-white font-mono">{msg.number}</td>
                    <td className="p-4 text-sm text-white font-mono">{msg.cli}</td>
                    <td className="p-4 text-sm text-white max-w-xs truncate">
                      {msg.message}
                      {otp && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-luxury-accent/20 text-luxury-accentLight text-xs">
                          OTP: {otp}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-white">${msg.payout.toFixed(3)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-luxury-success/20 text-luxury-success">
                        {msg.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(msg.message)}
                          className="p-2 hover:bg-luxury-accent/20 rounded-lg transition-colors"
                          title="Copy message"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                        {otp && (
                          <button
                            onClick={() => copyToClipboard(otp)}
                            className="p-2 hover:bg-luxury-accent/20 rounded-lg transition-colors"
                            title="Copy OTP"
                          >
                            <Copy className="w-4 h-4 text-luxury-accent" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-luxury-border">
          <p className="text-sm text-gray-400">
            Showing {messages.length} messages
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
