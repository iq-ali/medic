import { api } from './api'
import type { Student, StudentWithRelations } from '../types/student'

export interface StudentListResponse {
  students: Student[]
  total: number
  page: number
  pageSize: number
}

export interface StudentFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  grade: string
  disabilityType: string
  disabilitySeverity?: string
  diagnosisDate?: string
}

export const studentsService = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const query = qs.toString()
    return api.get<StudentListResponse>(`/students${query ? `?${query}` : ''}`)
  },
  getOne: (id: string) => api.get<{ student: StudentWithRelations }>(`/students/${id}`),
  create: (data: StudentFormData) => api.post<{ student: Student }>('/students', data),
  update: (id: string, data: Partial<StudentFormData>) =>
    api.put<{ student: Student }>(`/students/${id}`, data),
  remove: (id: string) => api.delete<void>(`/students/${id}`),
}
