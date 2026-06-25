const CLOUDINARY_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js'

const PLACEHOLDER_VALUES = new Set([
  '',
  'your-cloud-name',
  'your-unsigned-upload-preset',
  'your_upload_preset',
])

export const CLOUDINARY_ENV_KEYS = {
  cloudName: 'VITE_CLOUDINARY_CLOUD_NAME',
  uploadPreset: 'VITE_CLOUDINARY_UPLOAD_PRESET',
  folder: 'VITE_CLOUDINARY_FOLDER',
}

export function getCloudinaryConfig() {
  return {
    cloudName: (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim(),
    uploadPreset: (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim(),
    folder: (import.meta.env.VITE_CLOUDINARY_FOLDER || 'ofme-products').trim(),
  }
}

export function getCloudinaryConfigStatus() {
  const config = getCloudinaryConfig()
  const missing = []

  if (!config.cloudName || PLACEHOLDER_VALUES.has(config.cloudName)) {
    missing.push(CLOUDINARY_ENV_KEYS.cloudName)
  }

  if (!config.uploadPreset || PLACEHOLDER_VALUES.has(config.uploadPreset)) {
    missing.push(CLOUDINARY_ENV_KEYS.uploadPreset)
  }

  return {
    ...config,
    isConfigured: missing.length === 0,
    missing,
  }
}

export function isCloudinaryConfigured() {
  return getCloudinaryConfigStatus().isConfigured
}

let scriptPromise = null

export function loadCloudinaryScript() {
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CLOUDINARY_SCRIPT_URL}"]`)

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.')))
      return
    }

    const script = document.createElement('script')
    script.src = CLOUDINARY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

export async function openCloudinaryUploadWidget({ folder, onSuccess }) {
  const status = getCloudinaryConfigStatus()

  if (!status.isConfigured) {
    throw new Error(`Cloudinary 환경변수가 필요합니다: ${status.missing.join(', ')}`)
  }

  await loadCloudinaryScript()

  const { cloudName, uploadPreset, folder: defaultFolder } = getCloudinaryConfig()

  return new Promise((resolve, reject) => {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder: folder || defaultFolder,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 8000000,
        showPoweredBy: false,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        if (result?.event === 'success') {
          const url = result.info.secure_url
          onSuccess?.(url)
          resolve(url)
          return
        }

        if (result?.event === 'close') {
          resolve(null)
        }
      }
    )

    widget.open()
  })
}
