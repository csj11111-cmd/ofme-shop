import { useState } from 'react'
import { CLOUDINARY_ENV_KEYS } from '@/utils/cloudinary'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'

function ImageUploadField({ fieldKey, label, hint, value, onChange }) {
  const { upload, isUploading, error, isConfigured } = useCloudinaryUpload(fieldKey)
  const [localError, setLocalError] = useState('')

  const handleCloudinaryUpload = async () => {
    setLocalError('')

    await upload((url) => {
      onChange(url)
    })
  }

  const displayError = localError || error

  return (
    <div className={`ofme__image-field${value ? ' ofme__image-field--filled' : ''}`}>
      <div className="ofme__image-field-head">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="ofme__image-field-body">
        <div className="ofme__image-preview">
          {value ? (
            <img key={value} src={value} alt={`${label} 미리보기`} />
          ) : (
            <span>{isUploading ? '업로드 중...' : '이미지 없음'}</span>
          )}
        </div>
        <div className="ofme__image-field-actions">
          <button
            type="button"
            className="ofme__image-upload-btn"
            disabled={isUploading || !isConfigured}
            onClick={handleCloudinaryUpload}
          >
            {isUploading ? '업로드 중...' : 'Cloudinary 업로드'}
          </button>
          {value && (
            <button type="button" className="ofme__table-btn" onClick={() => onChange('')}>
              제거
            </button>
          )}
        </div>
        {!isConfigured && (
          <p className="ofme__image-field-note">
            {CLOUDINARY_ENV_KEYS.cloudName}, {CLOUDINARY_ENV_KEYS.uploadPreset} 설정 후 사용 가능
          </p>
        )}
        {displayError && <p className="ofme-auth__error">{displayError}</p>}
      </div>
    </div>
  )
}

export default ImageUploadField
