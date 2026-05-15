import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET_RECEIPTS = 'recipts'
const BUCKET_SCREENSHOTS = 'post_screenshots'

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-]/g, '')
}

export async function uploadReceipt(
  file: File,
  entrepreneurId: string
): Promise<string> {
  const timestamp = Date.now()
  const safeName = sanitizeFileName(file.name)
  const path = `${entrepreneurId}/${timestamp}-${safeName}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_RECEIPTS)
    .upload(path, file, { upsert: false })

  if (error) {
    throw new Error(`Error uploading receipt: ${error.message}`)
  }

  return path
}

export async function uploadPostScreenshot(
  file: File,
  entrepreneurId: string
): Promise<string> {
  const timestamp = Date.now()
  const safeName = sanitizeFileName(file.name)
  const path = `${entrepreneurId}/${timestamp}-${safeName}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_SCREENSHOTS)
    .upload(path, file, { upsert: false })

  if (error) {
    throw new Error(`Error uploading post screenshot: ${error.message}`)
  }

  return path
}
