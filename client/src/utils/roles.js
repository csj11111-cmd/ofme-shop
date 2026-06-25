export function isAdmin(user) {
  return user?.userType === 'admin'
}

export function isSeller(user) {
  return user?.userType === 'seller' || user?.userType === 'admin'
}

export function getRoleLabel(userType) {
  const labels = {
    customer: '고객',
    seller: '판매자',
    admin: '관리자',
  }

  return labels[userType] || userType
}
