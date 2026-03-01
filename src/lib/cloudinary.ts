import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: string): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder: 'football_store',
    resource_type: 'image',
  })
  return result.secure_url
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/')
  const fileWithExt = parts[parts.length - 1]
  const file = fileWithExt.split('.')[0]
  const folder = parts[parts.length - 2]
  return `${folder}/${file}`
}

export default cloudinary
