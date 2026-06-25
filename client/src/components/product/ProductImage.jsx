import { useEffect, useState } from 'react'

function ProductImage({
  src,
  fallback,
  alt = '',
  className,
  focal,
  objectPosition = 'top center',
  loading = 'lazy',
  style,
}) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback)
      setHasError(true)
    }
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={handleError}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition,
        display: 'block',
        ...(focal
          ? {
              transform: `scale(${focal.scale})`,
              transformOrigin: focal.origin,
            }
          : {}),
        ...style,
      }}
      data-load-failed={hasError || undefined}
    />
  )
}

export default ProductImage
