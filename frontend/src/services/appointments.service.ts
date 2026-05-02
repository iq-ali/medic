import { api } from './api'
import type { Appointment, AppointmentStatus } from '../types/appointment'

export interface AppointmentListResponse {
  appointments: Appointment[]
  total: number
  page: number
  pageSize: number
}

export interface AppointmentFormData {
  title: string
  description?: string
  scheduledAt: string
  durationMin: number
  status: AppointmentStatus
  location?: string
  notes?: string
  studentId: string
  staffId?: string | null
}

export const appointmentsService = {
  list: (params?: {
    search?: string
    studentId?: string
    staffId?: string
    status?: string
    page?: number
    pageSize?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.studentId) qs.set('studentId', params.studentId)
    if (params?.staffId) qs.set('staffId', params.staffId)
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const query = qs.toString()
    return api.get<AppointmentListResponse>(`/appointments${query ? `?${query}` : ''}`)
  },
  getOne: (id: string) => api.get<{ appointment: Appointment }>(`/appointments/${id}`),
  create: (data: AppointmentFormData) =>
    api.post<{ appointment: Appointment }>('/appointments', data),
  update: (id: string, data: Partial<AppointmentFormData>) =>
    api.put<{ appointment: Appointment }>(`/appointments/${id}`, data),
  remove: (id: string) => api.delete<void>(`/appointments/${id}`),
}
