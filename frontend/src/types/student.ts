export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type DisabilityType =
  | 'PHYSICAL'
  | 'COGNITIVE'
  | 'SENSORY'
  | 'SPEECH'
  | 'EMOTIONAL'
  | 'MULTIPLE'
  | 'OTHER'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  grade: string
  disabilityType: DisabilityType
  disabilitySeverity?: string | null
  diagnosisDate?: string | null
  photoUrl?: string | null
  approvalStatus: ApprovalStatus
  submittedById?: string | null
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  firstName: string
  lastName: string
  relationship: string
  phone: string
  email?: string | null
  studentId: string
}

export interface StudentWithRelations extends Student {
  guardians: Guardian[]
  medicalRecords: { id: string; title: string; recordDate: string }[]
  appointments: { id: string; title: string; scheduledAt: string; status: string }[]
}

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
}

export const DISABILITY_LABELS: Record<DisabilityType, string> = {
  PHYSICAL: 'Physical',
  COGNITIVE: 'Cognitive',
  SENSORY: 'Sensory',
  SPEECH: 'Speech',
  EMOTIONAL: 'Emotional',
  MULTIPLE: 'Multiple',
  OTHER: 'Other',
}
