export function buildSignupPayload(form) {
  const filledAddresses = form.addresses.filter((address) =>
    [address.alias, address.postcode, address.baseAddress, address.detailAddress].some(
      (value) => value.trim()
    )
  )

  const invalidAddress = filledAddresses.find(
    (address) =>
      !address.alias.trim() || !address.postcode.trim() || !address.baseAddress.trim()
  )

  if (invalidAddress) {
    throw new Error('입력한 배송지는 별칭, 우편번호, 기본주소를 모두 입력해 주세요.')
  }

  if (filledAddresses.length >= 2) {
    const defaultCount = filledAddresses.filter((address) => address.isDefault).length

    if (defaultCount !== 1) {
      throw new Error('기본 배송지로 사용할 곳을 1개 선택해 주세요.')
    }
  }

  if (form.password.length < 8) {
    throw new Error('비밀번호는 8자 이상이어야 합니다.')
  }

  if (form.password !== form.confirmPassword) {
    throw new Error('비밀번호가 일치하지 않습니다.')
  }

  if (!form.privacyAgreed) {
    throw new Error('개인정보 수집 및 이용에 동의해 주세요.')
  }

  const addresses = filledAddresses.map((address) => ({
    alias: address.alias.trim(),
    postcode: address.postcode.trim(),
    baseAddress: address.baseAddress.trim(),
    detailAddress: address.detailAddress.trim(),
    isDefault: filledAddresses.length === 1 ? true : address.isDefault,
  }))

  return {
    email: form.email.trim(),
    name: form.name.trim(),
    password: form.password,
    userType: form.userType,
    privacyAgreed: form.privacyAgreed,
    addresses,
  }
}
