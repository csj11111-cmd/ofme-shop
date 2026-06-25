import { useState } from 'react'
import { getCloudinaryConfig, isCloudinaryConfigured, openCloudinaryUploadWidget } from '@/utils/cloudinary'

export function useCloudinaryUpload(fieldKey) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const { folder: baseFolder } = getCloudinaryConfig()

  const upload = async (onSuccess) => {
    setError('')
    setIsUploading(true)

    try {
      const url = await openCloudinaryUploadWidget({
        folder: `${baseFolder}/${fieldKey}`,
        onSuccess,
      })

      return url
    } catch (uploadError) {
      setError(uploadError.message || 'Cloudinary 업로드에 실패했습니다.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    upload,
    isUploading,
    error,
    isConfigured: isCloudinaryConfigured(),
  }
}
