import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  className?: string
}

export default function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('glass-card-hover p-6 card-3d', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-luxury-accent/20 to-luxury-purple/20">
          <Icon className="w-6 h-6 text-luxury-accentLight" />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'text-sm font-medium',
            trend > 0 ? 'text-luxury-success' : 'text-luxury-error'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white glow-text">{value}</p>
    </motion.div>
  )
}
