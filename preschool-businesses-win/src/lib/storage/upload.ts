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
  category: 'photos' | 'documents' | 'receipts' | 'portfolio'
  path: string
  file: Buffer | File
  contentType?: string
}) {
  const client = getStorageClient()
  const bucket = `tenant-${tenantId}-${category}`

  // Ensure bucket exists
  const { error: bucketError } = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  })

  // Ignore "already exists" errors
  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(`Failed to create bucket: ${bucketError.message}`)
  }

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true })

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
  category: 'photos' | 'documents' | 'receipts' | 'portfolio'
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
