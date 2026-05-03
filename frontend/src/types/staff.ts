import type { Role } from './auth'

export interface Staff {
  id: string
  firstName: string
  lastName: string
  specialty?: string | null
  phone?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; role: Role; email: string } | null
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  THERAPIST: 'Therapist',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  STUDENT: 'Student',
}
