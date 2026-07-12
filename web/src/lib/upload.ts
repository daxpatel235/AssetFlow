/**
 * Uploads a file to the local Next.js API route (/api/upload).
 * The file is saved directly to the local hard drive in public/uploads.
 * 
 * @param file The File object from an <input type="file" />
 * @returns The public URL of the uploaded file (e.g. /uploads/...)
 */
export async function uploadLocalFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload file');
  }

  const data = await res.json();
  return data.url;
}
