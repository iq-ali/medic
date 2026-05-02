import { api } from './api'
import type { MedicalRecord } from '../types/medical'

export interface MedicalListResponse {
  records: MedicalRecord[]
  total: number
  page: number
  pageSize: number
}

export interface MedicalFormData {
  title: string
  description: string
  recordDate: string
  hospital?: string
  notes?: string
  studentId: string
  doctorId?: string | null
}

export const medicalService = {
  list: (params?: { search?: string; studentId?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.studentId) qs.set('studentId', params.studentId)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const query = qs.toString()
    return api.get<MedicalListResponse>(`/medical${query ? `?${query}` : ''}`)
  },
  getOne: (id: string) => api.get<{ record: MedicalRecord }>(`/medical/${id}`),
  create: (data: MedicalFormData) => api.post<{ record: MedicalRecord }>('/medical', data),
  update: (id: string, data: Partial<MedicalFormData>) =>
    api.put<{ record: MedicalRecord }>(`/medical/${id}`, data),
  remove: (id: string) => api.delete<void>(`/medical/${id}`),
}
