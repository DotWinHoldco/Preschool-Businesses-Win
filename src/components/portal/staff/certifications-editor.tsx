'use client'

// @anchor: cca.staff.certifications-editor

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  addStaffCertification,
  updateStaffCertification,
  deleteStaffCertification,
} from '@/lib/actions/staff/admin-actions'

export type CertRow = {
  id: string
  cert_name: string | null
  issuing_body: string | null
  issued_date: string | null
  expiry_date: string | null
  document_path: string | null
}

type FormState = {
  certification_name: string
  issuing_organization: string
  issued_date: string
  expiry_date: string
  certificate_url: string
}

const emptyForm: FormState = {
  certification_name: '',
  issuing_organization: '',
  issued_date: '',
  expiry_date: '',
  certificate_url: '',
}

export function CertificationsEditor({ staffId, certs }: { staffId: string; certs: CertRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [err, setErr] = useState<string | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErr(null)
    setOpen(true)
  }

  const openEdit = (c: CertRow) => {
    setEditingId(c.id)
    setForm({
      certification_name: c.cert_name ?? '',
      issuing_organization: c.issuing_body ?? '',
      issued_date: c.issued_date ?? '',
      expiry_date: c.expiry_date ?? '',
      certificate_url: c.document_path ?? '',
    })
    setErr(null)
    setOpen(true)
  }

  const submit = () => {
    setErr(null)
    startTransition(async () => {
      const payload = {
        certification_name: form.certification_name,
        issuing_organization: form.issuing_organization || null,
        issued_date: form.issued_date || null,
        expiry_date: form.expiry_date || null,
        certificate_url: form.certificate_url || null,
      }
      const res = editingId
        ? await updateStaffCertification(editingId, payload)
        : await addStaffCertification(staffId, payload)
      if (!res.ok) {
        setErr(res.error ?? 'Failed')
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this certification?')) return
    setErr(null)
    startTransition(async () => {
      const res = await deleteStaffCertification(id)
      if (!res.ok) setErr(res.error ?? 'Failed')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={openAdd}>
          + Add Certification
        </Button>
      </div>

      {certs.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No certifications on file.</p>
      ) : (
        <ul className="space-y-2">
          {certs.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md p-3 text-sm"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {c.cert_name ?? '—'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {c.issuing_body ?? ''} {c.expiry_date ? `· expires ${c.expiry_date}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title={editingId ? 'Edit Certification' : 'Add Certification'}
          className="max-w-md"
        >
          <DialogClose onClick={() => setOpen(false)} />
          <div className="space-y-3">
            {(
              [
                { key: 'certification_name', label: 'Certification name', required: true },
                { key: 'issuing_organization', label: 'Issuing organization', required: false },
                { key: 'issued_date', label: 'Issued date (YYYY-MM-DD)', required: false },
                { key: 'expiry_date', label: 'Expiry date (YYYY-MM-DD)', required: false },
                { key: 'certificate_url', label: 'Certificate URL', required: false },
              ] as const
            ).map((f) => (
              <label key={f.key} className="block">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {f.label}
                  {f.required ? ' *' : ''}
                </span>
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                  }}
                />
              </label>
            ))}
            {err && (
              <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                {err}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={isPending || !form.certification_name}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
