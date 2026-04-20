'use client'

// @anchor: cca.student.edit-dialog
// Modal dialog for editing student sections: overview, classroom, medical, allergies.
// Each section renders a sub-form that calls the corresponding server action.

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateOverview } from '@/lib/actions/student/update-overview'
import { updateMedical } from '@/lib/actions/student/update-medical'
import { addAllergy, removeAllergy } from '@/lib/actions/student/manage-allergies'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditSection = 'overview' | 'classroom' | 'medical' | 'allergies'

export interface StudentOverviewData {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string | null
}

export interface ClassroomOption {
  id: string
  name: string
}

export interface MedicalData {
  student_id: string
  blood_type?: string | null
  primary_physician_name?: string | null
  primary_physician_phone?: string | null
  insurance_provider?: string | null
  insurance_policy_number?: string | null
  special_needs_notes?: string | null
}

export interface AllergyItem {
  id: string
  allergen: string
  severity: string
}

export interface StudentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: EditSection
  studentId: string
  overview?: StudentOverviewData
  classrooms?: ClassroomOption[]
  currentClassroomId?: string | null
  medical?: MedicalData
  allergies?: AllergyItem[]
}

// ---------------------------------------------------------------------------
// Section titles
// ---------------------------------------------------------------------------

const sectionTitles: Record<EditSection, string> = {
  overview: 'Edit Profile',
  classroom: 'Edit Classroom',
  medical: 'Edit Medical Information',
  allergies: 'Manage Allergies',
}

// ---------------------------------------------------------------------------
// Label helper
// ---------------------------------------------------------------------------

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[var(--color-foreground)]"
    >
      {children}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Overview form
// ---------------------------------------------------------------------------

function OverviewForm({
  data,
  onSuccess,
}: {
  data: StudentOverviewData
  onSuccess: () => void
}) {
  const [firstName, setFirstName] = useState(data.first_name)
  const [lastName, setLastName] = useState(data.last_name)
  const [dob, setDob] = useState(data.date_of_birth)
  const [gender, setGender] = useState(data.gender ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await updateOverview({
        id: data.id,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        gender: gender ? (gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say') : null,
      })
      if (result.ok) {
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-first-name">First Name</Label>
          <Input
            id="edit-first-name"
            inputSize="sm"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-last-name">Last Name</Label>
          <Input
            id="edit-last-name"
            inputSize="sm"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-dob">Date of Birth</Label>
          <Input
            id="edit-dob"
            inputSize="sm"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-gender">Gender</Label>
          <Select
            id="edit-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
        </div>
      </div>
      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="sm" loading={isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Classroom form (placeholder — no server action for classroom reassignment yet)
// ---------------------------------------------------------------------------

function ClassroomForm({
  classrooms,
  currentClassroomId,
}: {
  classrooms: ClassroomOption[]
  currentClassroomId: string | null
  onSuccess: () => void
}) {
  const [selected, setSelected] = useState(currentClassroomId ?? '')

  return (
    <form className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-classroom">Classroom</Label>
        <Select
          id="edit-classroom"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Unassigned</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Classroom reassignment via the roster manager is coming soon.
      </p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Medical form
// ---------------------------------------------------------------------------

function MedicalForm({
  data,
  onSuccess,
}: {
  data: MedicalData
  onSuccess: () => void
}) {
  const [bloodType, setBloodType] = useState(data.blood_type ?? '')
  const [physician, setPhysician] = useState(data.primary_physician_name ?? '')
  const [physicianPhone, setPhysicianPhone] = useState(data.primary_physician_phone ?? '')
  const [insuranceProvider, setInsuranceProvider] = useState(data.insurance_provider ?? '')
  const [policyNumber, setPolicyNumber] = useState(data.insurance_policy_number ?? '')
  const [specialNeeds, setSpecialNeeds] = useState(data.special_needs_notes ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await updateMedical({
        student_id: data.student_id,
        blood_type: bloodType || null,
        primary_physician_name: physician || null,
        primary_physician_phone: physicianPhone || null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: policyNumber || null,
        special_needs_notes: specialNeeds || null,
      })
      if (result.ok) {
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-blood-type">Blood Type</Label>
          <Input
            id="edit-blood-type"
            inputSize="sm"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            placeholder="e.g. O+"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-physician">Primary Physician</Label>
          <Input
            id="edit-physician"
            inputSize="sm"
            value={physician}
            onChange={(e) => setPhysician(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-physician-phone">Physician Phone</Label>
          <Input
            id="edit-physician-phone"
            inputSize="sm"
            type="tel"
            value={physicianPhone}
            onChange={(e) => setPhysicianPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-insurance">Insurance Provider</Label>
          <Input
            id="edit-insurance"
            inputSize="sm"
            value={insuranceProvider}
            onChange={(e) => setInsuranceProvider(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-policy">Policy Number</Label>
        <Input
          id="edit-policy"
          inputSize="sm"
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-special-needs">Special Needs Notes</Label>
        <Textarea
          id="edit-special-needs"
          value={specialNeeds}
          onChange={(e) => setSpecialNeeds(e.target.value)}
          className="min-h-[80px]"
          placeholder="Any special needs or accommodations..."
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="sm" loading={isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Allergies form (simple text list, add/remove)
// ---------------------------------------------------------------------------

function AllergiesForm({
  studentId,
  allergies: initial,
  onSuccess,
}: {
  studentId: string
  allergies: AllergyItem[]
  onSuccess: () => void
}) {
  const [allergyList, setAllergyList] = useState<AllergyItem[]>(initial)
  const [newAllergen, setNewAllergen] = useState('')
  const [newSeverity, setNewSeverity] = useState<string>('moderate')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newAllergen.trim()) return
    setError('')
    startTransition(async () => {
      const result = await addAllergy({
        student_id: studentId,
        allergen: newAllergen.trim(),
        severity: newSeverity as 'mild' | 'moderate' | 'severe' | 'life_threatening',
        epipen_on_site: false,
      })
      if (result.ok && result.allergyId) {
        setAllergyList((prev) => [
          ...prev,
          { id: result.allergyId!, allergen: newAllergen.trim(), severity: newSeverity },
        ])
        setNewAllergen('')
        onSuccess()
      } else {
        setError(result.error ?? 'Failed to add allergy')
      }
    })
  }

  function handleRemove(allergyId: string) {
    setError('')
    startTransition(async () => {
      const result = await removeAllergy({
        id: allergyId,
        student_id: studentId,
      })
      if (result.ok) {
        setAllergyList((prev) => prev.filter((a) => a.id !== allergyId))
        onSuccess()
      } else {
        setError(result.error ?? 'Failed to remove allergy')
      }
    })
  }

  const severityColors: Record<string, string> = {
    mild: 'bg-yellow-100 text-yellow-800',
    moderate: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
    life_threatening: 'bg-red-200 text-red-900',
  }

  return (
    <div className="space-y-4">
      {/* Existing allergies */}
      {allergyList.length > 0 ? (
        <ul className="space-y-2">
          {allergyList.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-foreground)]">
                  {a.allergen}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    severityColors[a.severity] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {a.severity.replace(/_/g, ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(a.id)}
                disabled={isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-destructive)] transition-colors disabled:opacity-50"
                aria-label={`Remove ${a.allergen}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No known allergies
        </p>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="new-allergen">Add Allergen</Label>
          <Input
            id="new-allergen"
            inputSize="sm"
            value={newAllergen}
            onChange={(e) => setNewAllergen(e.target.value)}
            placeholder="e.g. Peanuts"
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label htmlFor="new-severity">Severity</Label>
          <Select
            id="new-severity"
            value={newSeverity}
            onChange={(e) => setNewSeverity(e.target.value)}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
            <option value="life_threatening">Life-threatening</option>
          </Select>
        </div>
        <Button type="submit" size="sm" loading={isPending} className="shrink-0">
          Add
        </Button>
      </form>

      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function StudentEditDialog({
  open,
  onOpenChange,
  section,
  studentId,
  overview,
  classrooms = [],
  currentClassroomId = null,
  medical,
  allergies = [],
}: StudentEditDialogProps) {
  const router = useRouter()

  function handleSuccess() {
    router.refresh()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <DialogContent title={sectionTitles[section]}>
        <DialogClose onClick={() => onOpenChange(false)} />

        {section === 'overview' && overview && (
          <OverviewForm data={overview} onSuccess={handleSuccess} />
        )}

        {section === 'classroom' && (
          <ClassroomForm
            classrooms={classrooms}
            currentClassroomId={currentClassroomId}
            onSuccess={handleSuccess}
          />
        )}

        {section === 'medical' && medical && (
          <MedicalForm data={medical} onSuccess={handleSuccess} />
        )}

        {section === 'allergies' && (
          <AllergiesForm
            studentId={studentId}
            allergies={allergies}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
