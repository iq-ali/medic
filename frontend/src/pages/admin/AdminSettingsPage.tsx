import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, UserX, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/admin.service'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { PendingUser, AdminSettings } from '@/types/auth'

export function AdminSettingsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingAutoApproval, setTogglingAutoApproval] = useState(false)
  const [actionIds, setActionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          adminService.getPendingUsers(),
          adminService.getSettings(),
        ])
        setPendingUsers(usersRes.users)
        setSettings(settingsRes.settings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleApprove(id: string) {
    setActionIds((s) => new Set(s).add(id))
    try {
      await adminService.approveUser(id)
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActionIds((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }

  async function handleDelete(id: string) {
    setActionIds((s) => new Set(s).add(id))
    try {
      await adminService.deleteUser(id)
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setActionIds((s) => { const n = new Set(s); n.delete(id); return n })
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

  return (
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

      {/* Pending users */}
      <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Pending signups</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingUsers.length === 0
              ? 'No pending signups'
              : `${pendingUsers.length} awaiting approval`}
          </p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            All caught up — no pending signups.
          </div>
        ) : (
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
                    onClick={() => handleApprove(u.id)}
                    disabled={actionIds.has(u.id)}
                    className="gap-1.5"
                  >
                    <UserCheck className="size-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(u.id)}
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
        )}
      </motion.div>
    </motion.div>
  )
}
