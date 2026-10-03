import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, Upload, Plus, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [newNumber, setNewNumber] = useState({
    range: '',
    country: '',
    prefix: '',
    number: '',
    payout: '0',
    plan: '7/7',
    status: 'ACTIVE',
  })
  const navigate = useNavigate()

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
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
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

      {/* Add Number Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-luxury-card p-6 rounded-xl w-[520px]">
            <h2 className="text-lg font-semibold text-white mb-4">Add Number</h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                className="input-field"
                placeholder="Number (e.g., 94712345678)"
                value={newNumber.number}
                onChange={(e) => setNewNumber({ ...newNumber, number: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Range"
                value={newNumber.range}
                onChange={(e) => setNewNumber({ ...newNumber, range: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Country"
                  value={newNumber.country}
                  onChange={(e) => setNewNumber({ ...newNumber, country: e.target.value })}
                />
                <input
                  className="input-field w-32"
                  placeholder="Prefix"
                  value={newNumber.prefix}
                  onChange={(e) => setNewNumber({ ...newNumber, prefix: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="Payout"
                  value={newNumber.payout}
                  onChange={(e) => setNewNumber({ ...newNumber, payout: e.target.value })}
                />
                <input
                  className="input-field w-32"
                  placeholder="Plan"
                  value={newNumber.plan}
                  onChange={(e) => setNewNumber({ ...newNumber, plan: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddNumber} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowImport(false)} />
          <div className="relative bg-luxury-card p-6 rounded-xl w-[640px]">
            <h2 className="text-lg font-semibold text-white mb-4">Import Numbers (CSV)</h2>
            <p className="text-sm text-gray-400 mb-3">Paste CSV rows: number,range,country,prefix,payout,plan,status</p>
            <textarea
              className="input-field min-h-[160px] w-full"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`94712345678,Sri Lanka LX 14Aug,Sri Lanka,94,0.018,7/7,ACTIVE`}
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setShowImport(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleImportNumbers} className="btn-primary">Import</button>
            </div>
          </div>
        </div>
      )}

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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/numbers/${number.id}`)}
                        title="View"
                        className="p-2 hover:bg-luxury-accent/20 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => updateNumberStatus(number.id, number.status)}
                        title="Toggle status"
                        className="p-2 hover:bg-luxury-accent/20 rounded-lg transition-colors"
                      >
                        {number.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
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
