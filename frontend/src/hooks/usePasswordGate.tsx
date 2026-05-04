import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'

export function usePasswordGate() {
  const pendingFnRef = useRef<(() => Promise<void>) | null>(null)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function gateAction(fn: () => Promise<void>): () => void {
    return () => {
      pendingFnRef.current = fn
      setPassword('')
      setError(null)
      setOpen(true)
    }
  }

  async function handleConfirm() {
    if (!pendingFnRef.current || !password) return
    setError(null)
    setLoading(true)
    try {
      await authService.verifyPassword(password)
      await pendingFnRef.current()
      setOpen(false)
      pendingFnRef.current = null
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setOpen(false)
    pendingFnRef.current = null
    setPassword('')
    setError(null)
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel() }}
    >
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-semibold">Admin verification</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your password to continue.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          <Button disabled={loading || !password} onClick={handleConfirm}>
            {loading ? 'Verifying…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return { gateAction, modal }
}
