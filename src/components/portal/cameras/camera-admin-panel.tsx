'use client'

// @anchor: cca.camera.admin-panel

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Camera as CameraIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { createCamera, updateCamera, deleteCamera } from '@/lib/actions/hardware/cameras'

export type Cam = {
  id: string
  name: string
  location: string | null
  hardware_type: string | null
  stream_url: string | null
  recording_enabled: boolean | null
  thumbnail_url: string | null
  status: string | null
}

export function CameraAdminPanel({ cameras }: { cameras: Cam[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Cam | 'new' | null>(null)
  const [pending, start] = useTransition()

  function remove(id: string) {
    if (!confirm('Archive this camera?')) return
    start(async () => {
      const res = await deleteCamera({ id })
      if (res.ok) router.refresh()
      else alert(res.error ?? 'Failed')
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus size={14} />
          Add Camera
        </Button>
      </div>

      {cameras.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <CameraIcon
            size={40}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No cameras configured. Click &quot;Add Camera&quot; to register the first device.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                className="aspect-video flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                {cam.thumbnail_url ? (
                  <img
                    src={cam.thumbnail_url}
                    alt={cam.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CameraIcon size={28} style={{ color: 'var(--color-muted-foreground)' }} />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {cam.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(cam)}
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                      style={{ color: 'var(--color-muted-foreground)' }}
                      aria-label={`Edit ${cam.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(cam.id)}
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--color-muted)]"
                      style={{ color: 'var(--color-muted-foreground)' }}
                      aria-label={`Archive ${cam.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {cam.location ?? 'No location set'}
                </p>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {cam.hardware_type && <span>{cam.hardware_type}</span>}
                  {cam.recording_enabled && <span>· Recording</span>}
                </div>
                <div
                  className="text-xs rounded-md px-2 py-1 inline-block"
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  View Stream (coming soon)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CameraDialog camera={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function CameraDialog({ camera, onClose }: { camera: Cam | 'new' | null; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isNew = camera === 'new'
  const existing = isNew ? null : (camera as Cam | null)

  const [form, setForm] = useState(() => ({
    name: existing?.name ?? '',
    location: existing?.location ?? '',
    hardware_type: existing?.hardware_type ?? '',
    stream_url: existing?.stream_url ?? '',
    thumbnail_url: existing?.thumbnail_url ?? '',
    recording_enabled: existing?.recording_enabled ?? false,
  }))

  // Reset form when camera prop changes
  const key = existing?.id ?? (isNew ? 'new' : 'closed')
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setForm({
      name: existing?.name ?? '',
      location: existing?.location ?? '',
      hardware_type: existing?.hardware_type ?? '',
      stream_url: existing?.stream_url ?? '',
      thumbnail_url: existing?.thumbnail_url ?? '',
      recording_enabled: existing?.recording_enabled ?? false,
    })
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const payload = {
        name: form.name,
        location: form.location || null,
        hardware_type: form.hardware_type || null,
        stream_url: form.stream_url || null,
        thumbnail_url: form.thumbnail_url || null,
        recording_enabled: form.recording_enabled,
      }
      const res = existing
        ? await updateCamera({ id: existing.id, ...payload })
        : await createCamera(payload)
      if (!res.ok) {
        setError(res.error ?? 'Failed')
        return
      }
      onClose()
      router.refresh()
    })
  }

  const open = camera !== null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title={existing ? 'Edit Camera' : 'Add Camera'}>
        <DialogClose onClick={onClose} />
        <form onSubmit={submit} className="space-y-3">
          <Input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Hardware type"
              value={form.hardware_type}
              onChange={(e) => setForm((s) => ({ ...s, hardware_type: e.target.value }))}
            />
            <Input
              placeholder="Thumbnail URL"
              value={form.thumbnail_url}
              onChange={(e) => setForm((s) => ({ ...s, thumbnail_url: e.target.value }))}
            />
          </div>
          <Textarea
            rows={2}
            placeholder="Stream URL (HLS/RTSP)"
            value={form.stream_url}
            onChange={(e) => setForm((s) => ({ ...s, stream_url: e.target.value }))}
          />
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-foreground)' }}
          >
            <input
              type="checkbox"
              checked={form.recording_enabled}
              onChange={(e) => setForm((s) => ({ ...s, recording_enabled: e.target.checked }))}
            />
            Recording enabled
          </label>
          {error && (
            <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={pending}>
              {existing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
