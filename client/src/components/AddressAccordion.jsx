import AddressBlock from '@/components/AddressBlock'

const hasAddressContent = (address) =>
  Boolean(
    address.alias.trim() ||
      address.postcode.trim() ||
      address.baseAddress.trim() ||
      address.detailAddress.trim()
  )

function getAddressSummary(address) {
  if (address.alias.trim()) {
    return address.alias.trim()
  }

  if (hasAddressContent(address)) {
    return '입력 중'
  }

  return '미입력'
}

function AddressAccordion({
  addresses,
  activeIndex,
  onToggle,
  onChange,
  onSelectDefault,
  onPostcodeSearchError,
  isAddressComplete,
}) {
  return (
    <div className="ofme-signup__address-accordion">
      {addresses.map((address, index) => {
        const isOpen = activeIndex === index

        return (
          <div
            key={index}
            className={`ofme-signup__address-item${isOpen ? ' ofme-signup__address-item--open' : ''}`}
          >
            <button
              type="button"
              className="ofme-signup__address-trigger"
              onClick={() => onToggle(index)}
              aria-expanded={isOpen}
            >
              <span className="ofme-signup__address-trigger-title">{index + 1}번 주소</span>
              <span className="ofme-signup__address-trigger-meta">
                {getAddressSummary(address)}
                {address.isDefault && isAddressComplete(address) && (
                  <span className="ofme-signup__address-badge">기본</span>
                )}
              </span>
              <span className="ofme-signup__address-chevron" aria-hidden="true">
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {isOpen && (
              <AddressBlock
                index={index}
                address={address}
                isComplete={isAddressComplete(address)}
                onChange={onChange}
                onSelectDefault={onSelectDefault}
                onPostcodeSearchError={onPostcodeSearchError}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AddressAccordion
