import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { env } from '@/lib/env';

// Enforce authentication for uploads
import { requireUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the request
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Validate file size and type (optional but recommended)
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // 4. Convert the File object to a Node.js Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Generate a unique, safe filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // sanitize
    const filename = `${uniqueSuffix}-${originalName}`;

    // 6. Define the upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });

    // 7. Write the file to the local disk
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 8. Return the public URL to the frontend
    // Since it's in the 'public/uploads' folder, Next.js serves it automatically at '/uploads/...'
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename,
      size: file.size,
      mimetype: file.type
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error during file upload' }, { status: 500 });
  }
}
