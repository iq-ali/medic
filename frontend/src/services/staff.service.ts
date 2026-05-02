import { api } from './api'
import type { Staff } from '../types/staff'

export interface StaffFormData {
  firstName: string
  lastName: string
  specialty?: string
  phone?: string
}

export const staffService = {
  list: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : ''
    return api.get<{ staff: Staff[] }>(`/staff${qs}`)
  },
  getOne: (id: string) => api.get<{ staff: Staff }>(`/staff/${id}`),
  create: (data: StaffFormData) => api.post<{ staff: Staff }>('/staff', data),
  update: (id: string, data: Partial<StaffFormData>) =>
    api.put<{ staff: Staff }>(`/staff/${id}`, data),
  remove: (id: string) => api.delete<void>(`/staff/${id}`),
}
