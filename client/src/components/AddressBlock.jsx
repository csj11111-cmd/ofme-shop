import { openDaumPostcode } from '@/utils/loadDaumPostcode'

function AddressBlock({
  index,
  address,
  isComplete,
  onChange,
  onSelectDefault,
  onPostcodeSearchError,
}) {
  const handleFieldChange = (field) => (event) => {
    onChange(index, field, event.target.value)
  }

  const handlePostcodeSearch = async () => {
    try {
      await openDaumPostcode((data) => {
        onChange(index, {
          postcode: data.zonecode,
          baseAddress: data.roadAddress || data.jibunAddress || '',
        })
      })
    } catch {
      onPostcodeSearchError('우편번호 검색 서비스를 불러오지 못했습니다.')
    }
  }

  return (
    <div className="ofme-signup__address-panel">
      <div className="ofme-auth__field">
        <label>별칭</label>
        <input
          type="text"
          value={address.alias}
          onChange={handleFieldChange('alias')}
          placeholder="예: 집, 회사, 부모님 댁"
        />
      </div>

      <div className="ofme-signup__postcode-row">
        <div className="ofme-auth__field">
          <label>우편번호</label>
          <input
            type="text"
            value={address.postcode}
            onChange={handleFieldChange('postcode')}
            placeholder="우편번호"
            readOnly
          />
        </div>
        <button type="button" className="ofme-signup__postcode-button" onClick={handlePostcodeSearch}>
          우편번호 검색
        </button>
      </div>

      <div className="ofme-auth__field">
        <label>기본주소</label>
        <input
          type="text"
          value={address.baseAddress}
          onChange={handleFieldChange('baseAddress')}
          placeholder="우편번호 검색 후 자동 입력"
          readOnly
        />
      </div>

      <div className="ofme-auth__field">
        <label>상세주소</label>
        <input
          type="text"
          value={address.detailAddress}
          onChange={handleFieldChange('detailAddress')}
          placeholder="동, 호수 등 상세주소 입력"
        />
      </div>

      <label
        className={`ofme-signup__default-option${isComplete ? '' : ' ofme-signup__default-option--disabled'}`}
      >
        <input
          type="radio"
          name="defaultAddress"
          checked={address.isDefault}
          disabled={!isComplete}
          onChange={() => onSelectDefault(index)}
        />
        <span>기본 배송지로 사용</span>
      </label>
    </div>
  )
}

export default AddressBlock
