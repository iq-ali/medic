import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, UserX, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/admin.service'
import { usePasswordGate } from '@/hooks/usePasswordGate'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { AdminSettings, AllUser } from '@/types/auth'

export function AdminSettingsPage() {
  const [users, setUsers] = useState<AllUser[]>([])
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingAutoApproval, setTogglingAutoApproval] = useState(false)
  const [actionIds, setActionIds] = useState<Set<string>>(new Set())
  const { gateAction, modal } = usePasswordGate()

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          adminService.getAllUsers(),
          adminService.getSettings(),
        ])
        setUsers(usersRes.users)
        setSettings(settingsRes.settings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function markBusy(id: string) { setActionIds((s) => new Set(s).add(id)) }
  function markIdle(id: string) { setActionIds((s) => { const n = new Set(s); n.delete(id); return n }) }

  async function handleApprove(id: string) {
    markBusy(id)
    try {
      await adminService.approveUser(id)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'APPROVED' as const } : u))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      markIdle(id)
    }
  }

  async function handleDelete(id: string) {
    markBusy(id)
    try {
      await adminService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      markIdle(id)
    }
  }

  async function handleToggleAutoApproval() {
    if (!settings) return
    setTogglingAutoApproval(true)
    try {
      const res = await adminService.updateSettings(!settings.autoApproval)
      setSettings(res.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setTogglingAutoApproval(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pendingUsers = users.filter((u) => u.status === 'PENDING')
  const approvedUsers = users.filter((u) => u.status === 'APPROVED')

  return (
    <>
      <motion.div
        variants={sectionContainerVariants}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto space-y-6 p-4 md:p-6"
      >
        <motion.div variants={sectionVariants}>
          <h1 className="text-2xl font-bold tracking-tight">Admin settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage signups and approval settings</p>
        </motion.div>

        {error && (
          <motion.p variants={sectionVariants} className="text-sm text-destructive">
            {error}
          </motion.p>
        )}

        {/* Auto-approval toggle */}
        <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold">Auto-approval</h2>
              <p className="text-sm text-muted-foreground">
                Automatically approve new signups without manual review.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoApproval}
              disabled={togglingAutoApproval}
              className="shrink-0 transition-opacity disabled:opacity-50"
              aria-label="Toggle auto-approval"
            >
              {settings?.autoApproval ? (
                <ToggleRight className="size-10 text-primary" />
              ) : (
                <ToggleLeft className="size-10 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Currently:{' '}
            <span className={settings?.autoApproval ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium'}>
              {settings?.autoApproval ? 'On — new users are approved instantly' : 'Off — new users need admin approval'}
            </span>
          </p>
        </motion.div>

        {/* Pending signups */}
        {pendingUsers.length > 0 && (
          <motion.div variants={sectionVariants} className="rounded-xl border border-amber-300 dark:border-amber-700 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <h2 className="text-base font-semibold">Pending approval</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} awaiting approval
              </p>
            </div>
            <ul className="divide-y divide-border">
              {pendingUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()} ·{' '}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={gateAction(async () => handleApprove(u.id))}
                      disabled={actionIds.has(u.id)}
                      className="gap-1.5"
                    >
                      <UserCheck className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={gateAction(async () => handleDelete(u.id))}
                      disabled={actionIds.has(u.id)}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <UserX className="size-3.5" />
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* All approved users */}
        <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">All users</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {approvedUsers.length === 0 ? 'No users yet' : `${approvedUsers.length} ${approvedUsers.length === 1 ? 'user' : 'users'}`}
            </p>
          </div>

          {approvedUsers.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No users yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {approvedUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()} ·{' '}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={gateAction(async () => handleDelete(u.id))}
                    disabled={actionIds.has(u.id)}
                    className="gap-1.5 text-destructive hover:text-destructive shrink-0"
                  >
                    <UserX className="size-3.5" />
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
      {modal}
    </>
  )
}
