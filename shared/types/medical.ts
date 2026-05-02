export interface MedicalRecord {
  id: string
  title: string
  description: string
  recordDate: string
  hospital?: string
  notes?: string
  studentId: string
  doctorId?: string
  createdAt: string
  updatedAt: string
}

export type CreateMedicalRecordPayload = Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>
