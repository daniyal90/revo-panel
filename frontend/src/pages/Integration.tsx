import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, Save, RefreshCw, Plug } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Integration() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const [activeTab, setActiveTab] = useState<'smpp' | 'http'>('smpp')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Array<{ name: string; status: string }>>([])

  useEffect(() => {
    api.get('/integration/status').then((res) => {
      const s = res.data
      setConnectionStatus([
        { name: 'SMPP', status: s.smpp?.status ?? 'DISCONNECTED' },
        { name: 'HTTP API', status: s.http?.status ?? 'NOT_CONFIGURED' },
        { name: 'Database', status: s.database?.status ?? 'DISCONNECTED' },
        { name: 'Redis', status: s.redis?.status ?? 'DISCONNECTED' },
      ])
    }).catch(() => {})
  }, [])

  const [smppConfig, setSmppConfig] = useState({
    host: '',
    port: 2775,
    systemId: '',
    password: '',
    systemType: '',
    ton: 0,
    npi: 1,
    tls: false,
  })

  const [httpConfig, setHttpConfig] = useState({
    endpoint: '',
    apiKey: '',
    bearerToken: '',
    username: '',
    password: '',
    senderId: '',
  })

  const handleSaveSMPP = async () => {
    if (!isAdmin) {
      toast.error('Only admins can modify integrations')
      return
    }
    setLoading(true)
    try {
      await api.post('/integration/smpp', smppConfig)
      toast.success('SMPP configuration saved')
    } catch (error) {
      toast.error('Failed to save SMPP configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveHTTP = async () => {
    if (!isAdmin) {
      toast.error('Only admins can modify integrations')
      return
    }
    setLoading(true)
    try {
      await api.post('/integration/http', httpConfig)
      toast.success('HTTP API configuration saved')
    } catch (error) {
      toast.error('Failed to save HTTP API configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestSMPP = async () => {
    setLoading(true)
    try {
      const response = await api.post('/integration/smpp/test', smppConfig)
      if (response.data.status === 'CONNECTED') {
        toast.success(`SMPP test: ${response.data.status} (${response.data.latency ?? '-'}ms)`)
      } else {
        toast.error(`SMPP test: ${response.data.status} — ${response.data.message}`)
      }
    } catch (error) {
      toast.error('SMPP connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTestHTTP = async () => {
    setLoading(true)
    try {
      const response = await api.post('/integration/http/test', httpConfig)
      if (response.data.status === 'CONNECTED') {
        toast.success(`HTTP test: ${response.data.status} (${response.data.latency ?? '-'}ms)`)
      } else {
        toast.error(`HTTP test: ${response.data.status} — ${response.data.message}`)
      }
    } catch (error) {
      toast.error('HTTP connection test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Integration</h1>
        <p className="text-gray-400">Configure SMPP and HTTP API connections</p>
        {!isAdmin && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxury-warning/10 border border-luxury-warning/30">
            <span className="text-xs font-medium text-luxury-warning">Read-only mode (Admin only)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => setActiveTab('smpp')}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all
            ${activeTab === 'smpp' 
              ? 'bg-luxury-accent text-white shadow-glow' 
              : 'text-gray-400 hover:text-white hover:bg-luxury-accent/20'}
          `}
        >
          SMPP 3.4
        </button>
        <button
          onClick={() => setActiveTab('http')}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all
            ${activeTab === 'http' 
              ? 'bg-luxury-accent text-white shadow-glow' 
              : 'text-gray-400 hover:text-white hover:bg-luxury-accent/20'}
          `}
        >
          HTTP API
        </button>
      </motion.div>

      {/* SMPP Configuration */}
      {activeTab === 'smpp' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-6 h-6 text-luxury-accent" />
            <h2 className="text-xl font-bold text-white">SMPP Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Host</label>
              <input
                type="text"
                value={smppConfig.host}
                onChange={(e) => setSmppConfig({ ...smppConfig, host: e.target.value })}
                className="input-field"
                placeholder="smpp.provider.com"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
              <input
                type="number"
                value={smppConfig.port}
                onChange={(e) => setSmppConfig({ ...smppConfig, port: parseInt(e.target.value) })}
                className="input-field"
                placeholder="2775"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">System ID</label>
              <input
                type="text"
                value={smppConfig.systemId}
                onChange={(e) => setSmppConfig({ ...smppConfig, systemId: e.target.value })}
                className="input-field"
                placeholder="Your system ID"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={smppConfig.password}
                onChange={(e) => setSmppConfig({ ...smppConfig, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">System Type</label>
              <input
                type="text"
                value={smppConfig.systemType}
                onChange={(e) => setSmppConfig({ ...smppConfig, systemType: e.target.value })}
                className="input-field"
                placeholder="SMPP"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">TON</label>
              <input
                type="number"
                value={smppConfig.ton}
                onChange={(e) => setSmppConfig({ ...smppConfig, ton: parseInt(e.target.value) })}
                className="input-field"
                placeholder="0"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">NPI</label>
              <input
                type="number"
                value={smppConfig.npi}
                onChange={(e) => setSmppConfig({ ...smppConfig, npi: parseInt(e.target.value) })}
                className="input-field"
                placeholder="1"
                disabled={!isAdmin}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="tls"
                checked={smppConfig.tls}
                onChange={(e) => setSmppConfig({ ...smppConfig, tls: e.target.checked })}
                disabled={!isAdmin}
                className="w-5 h-5 rounded border-luxury-border bg-luxury-dark text-luxury-accent focus:ring-luxury-accent"
              />
              <label htmlFor="tls" className="text-sm text-gray-300">Enable TLS/SSL</label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSaveSMPP}
              disabled={loading || !isAdmin}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            <button
              onClick={handleTestSMPP}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
          </div>
        </motion.div>
      )}

      {/* HTTP Configuration */}
      {activeTab === 'http' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Plug className="w-6 h-6 text-luxury-accent" />
            <h2 className="text-xl font-bold text-white">HTTP API Configuration</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint URL</label>
              <input
                type="url"
                value={httpConfig.endpoint}
                onChange={(e) => setHttpConfig({ ...httpConfig, endpoint: e.target.value })}
                className="input-field"
                placeholder="https://api.provider.com/sms"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
              <input
                type="password"
                value={httpConfig.apiKey}
                onChange={(e) => setHttpConfig({ ...httpConfig, apiKey: e.target.value })}
                className="input-field"
                placeholder="Your API key"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bearer Token</label>
              <input
                type="password"
                value={httpConfig.bearerToken}
                onChange={(e) => setHttpConfig({ ...httpConfig, bearerToken: e.target.value })}
                className="input-field"
                placeholder="Bearer token (optional)"
                disabled={!isAdmin}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={httpConfig.username}
                  onChange={(e) => setHttpConfig({ ...httpConfig, username: e.target.value })}
                  className="input-field"
                  placeholder="Username (optional)"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={httpConfig.password}
                  onChange={(e) => setHttpConfig({ ...httpConfig, password: e.target.value })}
                  className="input-field"
                  placeholder="Password (optional)"
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sender ID</label>
              <input
                type="text"
                value={httpConfig.senderId}
                onChange={(e) => setHttpConfig({ ...httpConfig, senderId: e.target.value })}
                className="input-field"
                placeholder="Default sender ID"
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSaveHTTP}
              disabled={loading || !isAdmin}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            <button
              onClick={handleTestHTTP}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </button>
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(connectionStatus.length ? connectionStatus : [
            { name: 'SMPP', status: 'DISCONNECTED' },
            { name: 'HTTP API', status: 'NOT_CONFIGURED' },
            { name: 'Database', status: 'DISCONNECTED' },
            { name: 'Redis', status: 'DISCONNECTED' },
          ]).map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border"
            >
              <div className={`
                status-dot ${item.status === 'CONNECTED' ? 'status-connected' : 'status-disconnected'}
              `} />
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-gray-400">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
