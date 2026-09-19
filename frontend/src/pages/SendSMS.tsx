import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SendSMS() {
  const [destination, setDestination] = useState('')
  const [senderId, setSenderId] = useState('')
  const [message, setMessage] = useState('')
  const [template, setTemplate] = useState('')
  const [provider, setProvider] = useState('')
  const [route, setRoute] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'delivered' | 'failed'>('idle')
  const [messageId, setMessageId] = useState('')
  const [otpMode, setOtpMode] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(5)

  const handleSend = async () => {
    if (!destination || !senderId || !message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSending(true)
    setStatus('sending')

    try {
      const endpoint = otpMode ? '/sms/otp' : '/sms/send'
      const payload = otpMode 
        ? { destination, expiry: otpExpiry }
        : { destination, sender: senderId, message, provider, route }

      const response = await api.post(endpoint, payload)
      
      if (otpMode) {
        if (response.data.otp) {
          toast.success(`OTP generated: ${response.data.otp} (DEMO MODE)`)
        } else {
          toast.success(response.data.message || 'OTP queued for delivery')
          setMessageId(response.data.messageId || '')
          setStatus('sending')
        }
      } else {
        setMessageId(response.data.sms?.id || '')
        setStatus(response.status === 202 ? 'sending' : 'delivered')
        toast.success(response.data.message || 'SMS queued for delivery')
      }
    } catch (error: any) {
      setStatus('failed')
      toast.error(error.response?.data?.error?.message || 'Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      await api.post('/sms/test-connection', { provider })
      toast.success('Connection test successful')
    } catch (error) {
      toast.error('Connection test failed')
    }
  }

  const handleClear = () => {
    setDestination('')
    setSenderId('')
    setMessage('')
    setTemplate('')
    setProvider('')
    setRoute('')
    setStatus('idle')
    setMessageId('')
  }

  const generateOTP = () => {
    setOtpMode(true)
    setTemplate('Your verification code is {{OTP}}. It expires in 5 minutes.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Send SMS</h1>
        <p className="text-gray-400">Send SMS messages and OTP codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 space-y-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setOtpMode(false)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${!otpMode ? 'bg-luxury-accent text-white' : 'text-gray-400 hover:text-white'}
              `}
            >
              SMS
            </button>
            <button
              onClick={generateOTP}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${otpMode ? 'bg-luxury-accent text-white' : 'text-gray-400 hover:text-white'}
              `}
            >
              OTP
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination Number
            </label>
            <input
              type="tel"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="input-field"
              placeholder="+947123456789"
            />
          </div>

          {!otpMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="input-field"
                  placeholder="LAMIX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Enter your message..."
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template
                </label>
                <input
                  type="text"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="input-field"
                  placeholder="Message template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="input-field"
                    placeholder="Provider name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Route
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="input-field"
                    placeholder="Route name"
                  />
                </div>
              </div>
            </>
          )}

          {otpMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OTP Expiry (minutes)
              </label>
              <input
                type="number"
                value={otpExpiry}
                onChange={(e) => setOtpExpiry(parseInt(e.target.value))}
                className="input-field"
                min={1}
                max={10}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {otpMode ? 'Generate OTP' : 'Send SMS'}
                </>
              )}
            </button>
            <button
              onClick={handleTestConnection}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </motion.div>

        {/* Status Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Status</h2>
          
          <div className="space-y-4">
            {/* Route Indicator */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
              {status === 'idle' && (
                <>
                  <Clock className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Ready</p>
                    <p className="text-xs text-gray-400">Waiting to send</p>
                  </div>
                </>
              )}
              {status === 'sending' && (
                <>
                  <RefreshCw className="w-6 h-6 text-luxury-accent animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-white">Sending</p>
                    <p className="text-xs text-gray-400">Message is being processed</p>
                  </div>
                </>
              )}
              {status === 'delivered' && (
                <>
                  <CheckCircle className="w-6 h-6 text-luxury-success" />
                  <div>
                    <p className="text-sm font-medium text-white">Delivered</p>
                    <p className="text-xs text-gray-400">Message sent successfully</p>
                  </div>
                </>
              )}
              {status === 'failed' && (
                <>
                  <XCircle className="w-6 h-6 text-luxury-error" />
                  <div>
                    <p className="text-sm font-medium text-white">Failed</p>
                    <p className="text-xs text-gray-400">Message delivery failed</p>
                  </div>
                </>
              )}
            </div>

            {/* Message Details */}
            {messageId && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400">Message Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Message ID</span>
                    <span className="text-sm text-white font-mono">{messageId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Destination</span>
                    <span className="text-sm text-white">{destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="text-sm text-luxury-success">Delivered</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Timestamp</span>
                    <span className="text-sm text-white">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Provider Response */}
            {status !== 'idle' && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400">Provider Response</h3>
                <div className="p-4 rounded-xl bg-luxury-dark/50 border border-luxury-border">
                  <p className="text-sm text-gray-300">
                    {status === 'delivered' 
                      ? 'Message accepted by provider. Delivery confirmed.'
                      : status === 'failed'
                      ? 'Provider rejected the message. Check destination number and provider settings.'
                      : 'Waiting for provider response...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
