import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '@/api/auth'
import { SHOP_NAME } from '@/data/ofMeCatalog'
import { buildSignupPayload } from '@/utils/buildSignupPayload'
import AddressAccordion from '@/components/AddressAccordion'
import ConfirmModal from '@/components/ConfirmModal'
import FieldLabel from '@/components/FieldLabel'
import '@/styles/ofme.css'

const USER_TYPES = [
  { value: 'customer', label: '고객' },
  { value: 'seller', label: '판매자' },
]

const createEmptyAddress = () => ({
  alias: '',
  postcode: '',
  baseAddress: '',
  detailAddress: '',
  isDefault: false,
})

const isAddressComplete = (address) =>
  Boolean(address.alias.trim() && address.postcode.trim() && address.baseAddress.trim())

const initialForm = {
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  userType: 'customer',
  addresses: [createEmptyAddress(), createEmptyAddress(), createEmptyAddress()],
  privacyAgreed: false,
  marketingAgreed: false,
}

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeAddressIndex, setActiveAddressIndex] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleAgreeAll = (event) => {
    const checked = event.target.checked
    setForm((prev) => ({
      ...prev,
      privacyAgreed: checked,
      marketingAgreed: checked,
    }))
    setError('')
  }

  const handleAddressChange = (index, fieldOrUpdates, value) => {
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) => {
        if (addressIndex !== index) {
          return address
        }

        if (typeof fieldOrUpdates === 'object') {
          return { ...address, ...fieldOrUpdates }
        }

        return { ...address, [fieldOrUpdates]: value }
      }),
    }))
    setError('')
  }

  const handleSelectDefaultAddress = (index) => {
    setForm((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) => ({
        ...address,
        isDefault: addressIndex === index,
      })),
    }))
    setError('')
  }

  const handleToggleAddress = (index) => {
    setActiveAddressIndex((prev) => (prev === index ? null : index))
  }

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false)
    navigate('/login')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    let payload

    try {
      payload = buildSignupPayload(form)
    } catch (validationError) {
      setError(validationError.message)
      return
    }

    setIsSubmitting(true)

    try {
      await registerUser(payload)
      setForm(initialForm)
      setActiveAddressIndex(null)
      setShowSuccessModal(true)
    } catch (submitError) {
      setError(submitError.message || '회원가입에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const agreeAll = form.privacyAgreed && form.marketingAgreed

  return (
    <div className="ofme-auth">
      <ConfirmModal
        isOpen={showSuccessModal}
        message="회원가입이 완료되었습니다. 로그인 후 쇼핑을 시작해 보세요."
        confirmText="로그인하러 가기"
        onConfirm={handleSuccessConfirm}
      />

      <main className="ofme-auth__main ofme-auth__main--signup">
        <Link to="/login" className="ofme-auth__back">
          ← 로그인
        </Link>

        <h1 className="ofme-auth__title">회원가입</h1>
        <p className="ofme-auth__subtitle">
          가입하고 첫 구매 <b>15% 쿠폰</b>을 받아보세요
        </p>

        <form className="ofme-auth__form" onSubmit={handleSubmit}>
          <div className="ofme-auth__field">
            <label htmlFor="name">
              <FieldLabel required>이름</FieldLabel>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
              required
            />
          </div>

          <div className="ofme-auth__field">
            <label htmlFor="email">
              <FieldLabel required>이메일</FieldLabel>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@fizz.com"
              required
            />
          </div>

          <div className="ofme-auth__row">
            <div className="ofme-auth__field">
              <label htmlFor="password">
                <FieldLabel required>비밀번호</FieldLabel>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="8자 이상"
                minLength={8}
                required
              />
            </div>
            <div className="ofme-auth__field">
              <label htmlFor="confirmPassword">
                <FieldLabel required>비밀번호 확인</FieldLabel>
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="다시 입력"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="ofme-auth__field">
            <label htmlFor="userType">
              <FieldLabel required>회원 유형</FieldLabel>
            </label>
            <select id="userType" name="userType" value={form.userType} onChange={handleChange} required>
              {USER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <section className="ofme-auth__section">
            <h2 className="ofme-auth__section-title">배송지 등록 (선택)</h2>
            <p className="ofme-auth__section-desc">
              별칭을 입력해 두면 나중에 배송지 선택 시 구분하기 쉽습니다. 배송지를 2개 이상 등록하면
              기본 배송지를 선택해 주세요.
            </p>
            <AddressAccordion
              addresses={form.addresses}
              activeIndex={activeAddressIndex}
              onToggle={handleToggleAddress}
              onChange={handleAddressChange}
              onSelectDefault={handleSelectDefaultAddress}
              onPostcodeSearchError={setError}
              isAddressComplete={isAddressComplete}
            />
          </section>

          <div className="ofme-auth__consent-box">
            <label className="ofme-auth__consent-item ofme-auth__consent-item--all">
              <input type="checkbox" checked={agreeAll} onChange={handleAgreeAll} />
              전체 동의
            </label>
            <div className="ofme-auth__consent-divider" />
            <label className="ofme-auth__consent-item">
              <input
                type="checkbox"
                name="privacyAgreed"
                checked={form.privacyAgreed}
                onChange={handleChange}
              />
              (필수) 개인정보 수집 · 이용 동의
            </label>
            <label className="ofme-auth__consent-item">
              <input
                type="checkbox"
                name="marketingAgreed"
                checked={form.marketingAgreed}
                onChange={handleChange}
              />
              (선택) 마케팅 정보 수신 동의
            </label>
          </div>

          {error && <p className="ofme-auth__error">{error}</p>}

          <button type="submit" className="ofme-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '가입하고 쿠폰 받기'}
          </button>
        </form>

        <p className="ofme-auth__guide">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>

        <footer className="ofme__footer" style={{ marginTop: 40, borderTop: 'none' }}>
          <div className="ofme__footer-logo">
            {SHOP_NAME}
            <span className="ofme__logo-dot">.</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default SignupPage
