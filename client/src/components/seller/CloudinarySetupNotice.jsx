import { CLOUDINARY_ENV_KEYS, getCloudinaryConfigStatus } from '@/utils/cloudinary'

function CloudinarySetupNotice() {
  const status = getCloudinaryConfigStatus()

  if (status.isConfigured) {
    return (
      <div className="ofme__cloudinary-status ofme__cloudinary-status--ready">
        Cloudinary 연결됨 · cloud: <code>{status.cloudName}</code> · folder:{' '}
        <code>{status.folder}</code>
      </div>
    )
  }

  return (
    <div className="ofme__cloudinary-status ofme__cloudinary-status--missing">
      <strong>Cloudinary 환경변수 설정 필요</strong>
      <p>`client/.env`에 아래 값을 넣고 dev 서버를 재시작하세요.</p>
      <pre>{`${CLOUDINARY_ENV_KEYS.cloudName}=your-cloud-name\n${CLOUDINARY_ENV_KEYS.uploadPreset}=your-unsigned-preset\n${CLOUDINARY_ENV_KEYS.folder}=ofme-products`}</pre>
      <p className="ofme__cloudinary-status-missing">
        누락: {status.missing.join(', ')}
      </p>
    </div>
  )
}

export default CloudinarySetupNotice
