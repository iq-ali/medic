import { api } from './api'
import type { PendingUser, AdminSettings } from '../types/auth'
import type { Student } from '../types/student'
import type { MedicalRecord } from '../types/medical'
import type { Appointment } from '../types/appointment'

type Submitter = { id: string; firstName: string | null; lastName: string | null; email: string; role: string }

export interface PendingStudent extends Student {
  submittedBy: Submitter | null
}

export interface PendingMedicalRecord extends MedicalRecord {
  submittedBy: Submitter | null
}

export interface PendingAppointment extends Appointment {
  submittedBy: Submitter | null
}

export interface PendingRecordsResponse {
  students: PendingStudent[]
  medicalRecords: PendingMedicalRecord[]
  appointments: PendingAppointment[]
}

export const adminService = {
  getPendingUsers: () => api.get<{ users: PendingUser[] }>('/admin/pending-users'),

  approveUser: (id: string) =>
    api.post<{ message: string }>(`/admin/users/${id}/approve`, {}),

  deleteUser: (id: string) => api.delete<{ message: string }>(`/admin/users/${id}`),

  getSettings: () => api.get<{ settings: AdminSettings }>('/admin/settings'),

  updateSettings: (autoApproval: boolean) =>
    api.put<{ settings: AdminSettings }>('/admin/settings', { autoApproval }),

  getPendingRecords: () => api.get<PendingRecordsResponse>('/admin/pending-records'),

  approveRecord: (type: 'students' | 'medical' | 'appointments', id: string) =>
    api.post<{ message: string }>(`/admin/records/${type}/${id}/approve`, {}),

  rejectRecord: (type: 'students' | 'medical' | 'appointments', id: string) =>
    api.delete<void>(`/admin/records/${type}/${id}`),
}
