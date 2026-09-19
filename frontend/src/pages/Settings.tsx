import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Shield, 
  Moon,
  Sun,
  Save
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'security'>('general')
  const [loading, setLoading] = useState(false)
  
  const [preferences, setPreferences] = useState({
    theme: 'luxury-dark',
    animationIntensity: 'normal',
    compactMode: false,
    timezone: 'UTC',
    currency: 'USD',
    autoRefreshInterval: 30000,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.patch('/settings/preferences', preferences)
      toast.success('Preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400">Configure your application preferences</p>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-luxury-accent text-white shadow-glow' 
                  : 'text-gray-400 hover:text-white hover:bg-luxury-accent/20'}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className="input-field"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New York</option>
              <option value="America/Los_Angeles">America/Los Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auto Refresh Interval (ms)
            </label>
            <input
              type="number"
              value={preferences.autoRefreshInterval}
              onChange={(e) => setPreferences({ ...preferences, autoRefreshInterval: parseInt(e.target.value) })}
              className="input-field"
              min={5000}
              step={5000}
            />
            <p className="text-xs text-gray-500 mt-1">How often to refresh data (5000ms = 5 seconds)</p>
          </div>
        </motion.div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Appearance</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">Theme</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPreferences({ ...preferences, theme: 'luxury-dark' })}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${preferences.theme === 'luxury-dark' 
                    ? 'border-luxury-accent bg-luxury-accent/10' 
                    : 'border-luxury-border hover:border-luxury-accent/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-luxury-accent" />
                  <div className="text-left">
                    <p className="font-medium text-white">Luxury Dark</p>
                    <p className="text-xs text-gray-400">Dark premium theme</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setPreferences({ ...preferences, theme: 'luxury-light' })}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${preferences.theme === 'luxury-light' 
                    ? 'border-luxury-accent bg-luxury-accent/10' 
                    : 'border-luxury-border hover:border-luxury-accent/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-luxury-accent" />
                  <div className="text-left">
                    <p className="font-medium text-white">Luxury Light</p>
                    <p className="text-xs text-gray-400">Light premium theme</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Animation Intensity</label>
            <select
              value={preferences.animationIntensity}
              onChange={(e) => setPreferences({ ...preferences, animationIntensity: e.target.value })}
              className="input-field"
            >
              <option value="reduced">Reduced</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="compactMode"
              checked={preferences.compactMode}
              onChange={(e) => setPreferences({ ...preferences, compactMode: e.target.checked })}
              className="w-5 h-5 rounded border-luxury-border bg-luxury-dark text-luxury-accent focus:ring-luxury-accent"
            />
            <label htmlFor="compactMode" className="text-sm text-gray-300">Compact Mode</label>
          </div>
        </motion.div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
          
          <div className="space-y-4">
            {[
              'SMS delivery notifications',
              'Incoming SMS alerts',
              'Connection status changes',
              'Error notifications',
              'Daily summary reports',
            ].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
                <span className="text-sm text-white">{item}</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-luxury-border bg-luxury-dark text-luxury-accent focus:ring-luxury-accent"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Security</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Two-Factor Authentication</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-luxury-warning/20 text-luxury-warning">
                  Disabled
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Add an extra layer of security to your account</p>
              <button className="btn-secondary text-sm">Enable 2FA</button>
            </div>

            <div className="p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Session Timeout</span>
                <span className="text-xs text-gray-400">7 days</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Automatically log out after inactivity</p>
              <select className="input-field text-sm">
                <option>15 minutes</option>
                <option>1 hour</option>
                <option>24 hours</option>
                <option selected>7 days</option>
                <option>Never</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
              <span className="text-sm font-medium text-white block mb-2">API Keys</span>
              <p className="text-xs text-gray-400 mb-3">Manage your API keys for external integrations</p>
              <button className="btn-secondary text-sm">Manage API Keys</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>
    </div>
  )
}
