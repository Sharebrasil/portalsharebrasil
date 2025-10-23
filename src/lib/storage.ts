import { put, del, list } from '@vercel/blob';

const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.warn('BLOB_READ_WRITE_TOKEN not set, file uploads will not work');
}

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const blob = await put(path, file, {
      access: 'public',
      token: BLOB_TOKEN,
    });

    return blob.url;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url, { token: BLOB_TOKEN });
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
}

export async function listFiles(prefix?: string) {
  try {
    const { blobs } = await list({
      token: BLOB_TOKEN,
      prefix,
    });

    return blobs;
  } catch (error) {
    console.error('File list error:', error);
    throw new Error('Failed to list files');
  }
}
