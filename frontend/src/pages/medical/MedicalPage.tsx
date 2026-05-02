import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { medicalService } from '@/services/medical.service'
import { useAuth } from '@/hooks/useAuth'
import type { MedicalRecord } from '@/types/medical'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function MedicalPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const studentId = searchParams.get('studentId') ?? undefined

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, studentId])

  useEffect(() => {
    setLoading(true)
    medicalService
      .list({ search: debouncedSearch, studentId, page, pageSize })
      .then(({ records: r, total: t }) => {
        setRecords(r)
        setTotal(t)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch, studentId, page])

  const totalPages = Math.ceil(total / pageSize)
  const canWrite = user?.role === 'ADMIN' || user?.role === 'DOCTOR'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title or hospital…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {canWrite && (
          <Button
            size="sm"
            onClick={() =>
              navigate(studentId ? `/medical/new?studentId=${studentId}` : '/medical/new')
            }
          >
            <Plus />
            Add Record
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Doctor</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Hospital</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No medical records found.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {formatDate(r.recordDate)}
                  </td>
                  <td className="py-3 px-4 font-medium">{r.title}</td>
                  <td className="py-3 px-4">
                    <button
                      className="hover:underline text-left"
                      onClick={() => navigate(`/students/${r.student.id}`)}
                    >
                      {r.student.firstName} {r.student.lastName}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.hospital ?? '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/medical/${r.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
