import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Phone, 
  Send, 
  Inbox, 
  BarChart3, 
  Settings, 
  Network,
  LogOut,
  Menu
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect } from 'react'
import api from '../utils/api'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Numbers', href: '/numbers', icon: Phone },
  { name: 'Send SMS', href: '/send-sms', icon: Send },
  { name: 'Incoming SMS', href: '/incoming-sms', icon: Inbox },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'SMPP/HTTP', href: '/integration', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appMode, setAppMode] = useState<'production' | 'demo' | 'development'>('development')

  useEffect(() => {
    api.get('/config/mode').then((res) => setAppMode(res.data.mode)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-luxury-darker">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 glass-card border-r border-luxury-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-luxury-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-luxury-accent to-luxury-purple bg-clip-text text-transparent">
              LAMIX SMS
            </h1>
            <p className="text-xs text-gray-400 mt-1">Command Center</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-luxury-accent/20 to-luxury-purple/20 text-luxury-accentLight border border-luxury-accent/30'
                      : 'text-gray-400 hover:text-white hover:bg-luxury-accent/10'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-luxury-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-accent to-luxury-purple flex items-center justify-center font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                text-gray-400 hover:text-white hover:bg-luxury-error/20 hover:border-luxury-error/50
                border border-transparent transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-card border-b border-luxury-border px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-luxury-accent/20 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              {appMode === 'production' ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxury-success/10 border border-luxury-success/30">
                  <div className="w-2 h-2 rounded-full bg-luxury-success animate-pulse" />
                  <span className="text-xs font-medium text-luxury-success">PRODUCTION MODE</span>
                </div>
              ) : appMode === 'demo' ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxury-warning/10 border border-luxury-warning/30">
                  <div className="w-2 h-2 rounded-full bg-luxury-warning animate-pulse" />
                  <span className="text-xs font-medium text-luxury-warning">DEMO MODE</span>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
