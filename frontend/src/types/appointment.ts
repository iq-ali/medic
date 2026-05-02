export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'

export interface Appointment {
  id: string
  title: string
  description?: string | null
  scheduledAt: string
  durationMin: number
  status: AppointmentStatus
  location?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  studentId: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentId: string
  }
  staffId?: string | null
  staff?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
  CANCELLED: 'Cancelled',
}

export const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-muted text-foreground',
  COMPLETED: 'bg-muted text-muted-foreground',
  MISSED: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground opacity-60',
}
