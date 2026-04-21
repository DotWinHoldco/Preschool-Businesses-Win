// @anchor: platform.storage
// Supabase Storage upload helpers — tenant-isolated buckets

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getStorageClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

type FileCategory = 'photos' | 'documents' | 'receipts' | 'portfolio'

const ALLOWED_TYPES: Record<FileCategory, string[]> = {
  photos: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  documents: [
    'application/pdf', 'image/jpeg', 'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  receipts: ['application/pdf', 'image/jpeg', 'image/png'],
  portfolio: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
}

function sanitizePath(filePath: string): string {
  const normalized = filePath
    .replace(/\\/g, '/')
    .replace(/\.{2,}/g, '.')
    .replace(/\/+/g, '/')
    .replace(/^\//, '')

  if (normalized.includes('../') || normalized.includes('/..')) {
    throw new Error('Invalid file path: directory traversal not allowed')
  }

  if (!/^[\w\-./]+$/.test(normalized)) {
    throw new Error('Invalid file path: contains disallowed characters')
  }

  return normalized
}

function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  const sig = buffer.subarray(0, 12)

  if (sig[0] === 0xFF && sig[1] === 0xD8 && sig[2] === 0xFF) return 'image/jpeg'
  if (sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4E && sig[3] === 0x47) return 'image/png'
  if (sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46 &&
      sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50) return 'image/webp'
  if (sig[0] === 0x25 && sig[1] === 0x50 && sig[2] === 0x44 && sig[3] === 0x46) return 'application/pdf'
  if (sig[4] === 0x66 && sig[5] === 0x74 && sig[6] === 0x79 && sig[7] === 0x70) return 'video/mp4'

  return null
}

/**
 * Upload a file to tenant-isolated storage
 * Bucket naming: tenant-{tenantId}-{category}
 */
export async function uploadFile({
  tenantId,
  category,
  path,
  file,
  contentType,
}: {
  tenantId: string
  category: FileCategory
  path: string
  file: Buffer | File
  contentType?: string
}) {
  const client = getStorageClient()
  const bucket = `tenant-${tenantId}-${category}`
  const safePath = sanitizePath(path)

  const allowedMimes = ALLOWED_TYPES[category]
  if (contentType && !allowedMimes.includes(contentType)) {
    throw new Error(`File type ${contentType} not allowed for ${category}`)
  }

  if (Buffer.isBuffer(file)) {
    const detected = detectMimeType(file)
    if (detected && !allowedMimes.includes(detected)) {
      throw new Error(`File content (${detected}) does not match allowed types for ${category}`)
    }
  }

  const { error: bucketError } = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
  })

  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(`Failed to create bucket: ${bucketError.message}`)
  }

  const { data, error } = await client.storage
    .from(bucket)
    .upload(safePath, file, { contentType, upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)
  return data
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl({
  tenantId,
  category,
  path,
  expiresIn = 3600,
}: {
  tenantId: string
  category: FileCategory
  path: string
  expiresIn?: number
}) {
  const client = getStorageClient()
  const bucket = `tenant-${tenantId}-${category}`

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw new Error(`Signed URL failed: ${error.message}`)
  return data.signedUrl
}
