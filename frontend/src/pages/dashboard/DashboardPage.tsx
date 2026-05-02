import { useEffect, useState } from 'react'
import { Users, CalendarDays, UserCog, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { containerVariants, itemVariants, cardHover } from '@/lib/animations'

interface Stats {
  students: number
  appointmentsToday: number
  staff: number
  medicalRecords: number
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return (
    <motion.div
      variants={itemVariants}
      {...cardHover}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </motion.div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const username = user?.email.split('@')[0] ?? ''
  const capitalized = username.charAt(0).toUpperCase() + username.slice(1)

  useEffect(() => {
    api.get<Stats>('/dashboard/stats').then(setStats).catch(() => {})
  }, [])

  const display = (n: number | undefined) => (n !== undefined ? n : '—')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {greeting()}, {capitalized}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's an overview of the system.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard label="Students" value={display(stats?.students)} icon={Users} />
        <StatCard
          label="Appointments Today"
          value={display(stats?.appointmentsToday)}
          icon={CalendarDays}
        />
        <StatCard label="Staff Members" value={display(stats?.staff)} icon={UserCog} />
        <StatCard
          label="Medical Records"
          value={display(stats?.medicalRecords)}
          icon={FileText}
        />
      </motion.div>
    </div>
  )
}
