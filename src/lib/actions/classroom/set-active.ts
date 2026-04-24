'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function setActiveClassroom(classroomId: string) {
  await assertRole('aide')
  const cookieStore = await cookies()
  if (classroomId) {
    if (!UUID_RE.test(classroomId)) {
      throw new Error('Invalid classroom ID format')
    }
    cookieStore.set('active_classroom_id', classroomId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  } else {
    cookieStore.delete('active_classroom_id')
  }
  revalidatePath('/portal', 'layout')
}
