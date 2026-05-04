export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MedicalRecord {
  id: string
  title: string
  description: string
  recordDate: string
  hospital?: string | null
  notes?: string | null
  approvalStatus: ApprovalStatus
  submittedById?: string | null
  createdAt: string
  updatedAt: string
  studentId: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentId: string
  }
  doctorId?: string | null
  doctor?: {
    id: string
    firstName: string
    lastName: string
  } | null
}
