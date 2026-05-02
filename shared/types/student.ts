export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type DisabilityType = 'PHYSICAL' | 'COGNITIVE' | 'SENSORY' | 'SPEECH' | 'EMOTIONAL' | 'MULTIPLE' | 'OTHER'

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  grade: string
  disabilityType: DisabilityType
  disabilitySeverity?: string
  diagnosisDate?: string
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  firstName: string
  lastName: string
  relationship: string
  phone: string
  email?: string
}

export type CreateStudentPayload = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
