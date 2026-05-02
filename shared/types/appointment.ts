export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'

export interface Appointment {
  id: string
  title: string
  description?: string
  scheduledAt: string
  durationMin: number
  status: AppointmentStatus
  location?: string
  notes?: string
  studentId: string
  staffId?: string
  createdAt: string
  updatedAt: string
}

export type CreateAppointmentPayload = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
