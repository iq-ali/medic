import { api } from './api'
import type { PendingUser, AdminSettings } from '../types/auth'

export const adminService = {
  getPendingUsers: () => api.get<{ users: PendingUser[] }>('/admin/pending-users'),

  approveUser: (id: string) =>
    api.post<{ message: string }>(`/admin/users/${id}/approve`, {}),

  deleteUser: (id: string) => api.delete<{ message: string }>(`/admin/users/${id}`),

  getSettings: () => api.get<{ settings: AdminSettings }>('/admin/settings'),

  updateSettings: (autoApproval: boolean) =>
    api.put<{ settings: AdminSettings }>('/admin/settings', { autoApproval }),
}
