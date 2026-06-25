import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateMe } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

function MyInfoPage() {
  const { user, updateSessionUser } = useAuth()
  const defaultAddress = useMemo(
    () => user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0] || null,
    [user]
  )

  const [form, setForm] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: user?.phone || '',
    alias: defaultAddress?.alias || '기본 배송지',
    postcode: defaultAddress?.postcode || '',
    baseAddress: defaultAddress?.baseAddress || '',
    detailAddress: defaultAddress?.detailAddress || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  if (!user) {
    return null
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const nextAddresses = form.baseAddress || form.postcode || form.detailAddress
        ? [
            {
              alias: form.alias,
              postcode: form.postcode,
              baseAddress: form.baseAddress,
              detailAddress: form.detailAddress,
              isDefault: true,
            },
            ...(user.addresses || []).filter((address) => !address.isDefault).slice(0, 2),
          ]
        : user.addresses || []

      const data = await updateMe({
        email: form.email,
        name: form.name,
        phone: form.phone,
        addresses: nextAddresses,
      })

      updateSessionUser(data.user)
      window.alert('내 정보가 수정되었습니다.')
    } catch (error) {
      window.alert(error.message || '내 정보 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="ofme__page-main">
      <div className="ofme__page-head">
        <h1>내 정보</h1>
        <p>개인정보와 기본 배송지를 수정할 수 있습니다.</p>
      </div>

      <form className="ofme__panel" onSubmit={handleSubmit}>
        <label className="ofme__field">
          <span>이메일 아이디</span>
          <input value={form.email} onChange={handleChange('email')} type="email" required />
        </label>
        <label className="ofme__field">
          <span>이름</span>
          <input value={form.name} onChange={handleChange('name')} type="text" required />
        </label>
        <label className="ofme__field">
          <span>핸드폰번호</span>
          <input value={form.phone} onChange={handleChange('phone')} type="tel" placeholder="010-0000-0000" />
        </label>
        <label className="ofme__field">
          <span>배송지명</span>
          <input value={form.alias} onChange={handleChange('alias')} type="text" />
        </label>
        <label className="ofme__field">
          <span>우편번호</span>
          <input value={form.postcode} onChange={handleChange('postcode')} type="text" />
        </label>
        <label className="ofme__field">
          <span>기본 주소</span>
          <input value={form.baseAddress} onChange={handleChange('baseAddress')} type="text" />
        </label>
        <label className="ofme__field">
          <span>상세 주소</span>
          <input value={form.detailAddress} onChange={handleChange('detailAddress')} type="text" />
        </label>

        <div className="ofme__page-actions" style={{ marginTop: 16 }}>
          <Link to="/mypage" className="ofme__btn-outline ofme__btn-inline">
            주문내역으로
          </Link>
          <button type="submit" className="ofme__btn-primary ofme__btn-inline" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default MyInfoPage
