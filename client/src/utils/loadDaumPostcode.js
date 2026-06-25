const DAUM_POSTCODE_SCRIPT =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

export function loadDaumPostcode() {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve(window.daum.Postcode)
      return
    }

    const existingScript = document.querySelector(`script[src="${DAUM_POSTCODE_SCRIPT}"]`)

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.daum.Postcode))
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = DAUM_POSTCODE_SCRIPT
    script.async = true
    script.onload = () => resolve(window.daum.Postcode)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export function openDaumPostcode(onComplete) {
  return loadDaumPostcode().then(
    (Postcode) =>
      new Postcode({
        oncomplete: onComplete,
      }).open()
  )
}
