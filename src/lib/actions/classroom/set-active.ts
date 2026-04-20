'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setActiveClassroom(classroomId: string) {
  const cookieStore = await cookies()
  if (classroomId) {
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
