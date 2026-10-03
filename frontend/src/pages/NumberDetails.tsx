import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function NumberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [number, setNumber] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchNumber()
  }, [id])

  const fetchNumber = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/numbers/${id}`)
      setNumber(res.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Number not found')
        setNumber(null)
      } else {
        toast.error('Failed to load number')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="glass-card p-6">Loading...</div>
  if (!number) return (
    <div className="space-y-6">
      <div className="glass-card p-6">Number not found.</div>
      <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Number Details</h1>
          <p className="text-gray-400">Detailed information for number</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Number</label>
            <div className="text-white font-mono mt-1">{number.number}</div>
          </div>
          <div>
            <label className="text-sm text-gray-400">Range</label>
            <div className="text-white mt-1">{number.range}</div>
          </div>
          <div>
            <label className="text-sm text-gray-400">Country</label>
            <div className="text-white mt-1">{number.country}</div>
          </div>
          <div>
            <label className="text-sm text-gray-400">Payout</label>
            <div className="text-white mt-1">${Number(number.payout).toFixed(3)}</div>
          </div>
          <div>
            <label className="text-sm text-gray-400">Plan</label>
            <div className="text-white mt-1">{number.plan}</div>
          </div>
          <div>
            <label className="text-sm text-gray-400">Status</label>
            <div className="text-white mt-1">{number.status}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
