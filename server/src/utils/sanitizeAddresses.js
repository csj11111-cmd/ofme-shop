const sanitizeAddresses = (addresses) => {
  if (!Array.isArray(addresses)) {
    return [];
  }

  const sanitized = addresses
    .filter((address) => {
      if (!address) {
        return false;
      }

      const { alias, postcode, baseAddress, detailAddress } = address;

      return Boolean(alias || postcode || baseAddress || detailAddress);
    })
    .slice(0, 3)
    .map(
      ({
        alias = '',
        postcode = '',
        baseAddress = '',
        detailAddress = '',
        isDefault = false,
      }) => ({
        alias: alias.trim(),
        postcode: postcode.trim(),
        baseAddress: baseAddress.trim(),
        detailAddress: detailAddress.trim(),
        isDefault: Boolean(isDefault),
      })
    );

  if (sanitized.length === 0) {
    return [];
  }

  if (sanitized.length === 1) {
    sanitized[0].isDefault = true;
    return sanitized;
  }

  const defaultAddresses = sanitized.filter((address) => address.isDefault);

  if (defaultAddresses.length !== 1) {
    sanitized.forEach((address, index) => {
      address.isDefault = index === 0;
    });
  }

  return sanitized;
};

module.exports = sanitizeAddresses;
