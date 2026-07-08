import { withRoute, ApiError } from '@/lib/api/withRoute';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = withRoute({
  requiredRole: 'staff',
  handler: async ({ req }) => {
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      throw new ApiError('VALIDATION', 'Malformed form data', 400);
    }

    const file = formData.get('file');
    if (!file) {
      throw new ApiError('VALIDATION', 'No file provided', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'stopshop', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    let url = uploadResult.secure_url;
    if (url && url.includes('/upload/')) {
      url = url.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    return { url };
  }
});
