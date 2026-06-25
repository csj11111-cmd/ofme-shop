import { Routes, Route } from 'react-router-dom'
import { RequireAdmin, RequireAuth, RequireSeller } from '@/components/auth/RequireAuth'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import ShopLayout from '@/components/layout/ShopLayout'
import HomePage from '@/pages/HomePage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderCompletePage from '@/pages/OrderCompletePage'
import OrderFailedPage from '@/pages/OrderFailedPage'
import MyPage from '@/pages/user/MyPage'
import MyInfoPage from '@/pages/user/MyInfoPage'
import MyReviewsPage from '@/pages/user/MyReviewsPage'
import AdminPage from '@/pages/admin/AdminPage'
import SellerPage from '@/pages/seller/SellerPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import LogoutPage from '@/pages/LogoutPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<ShopLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route
              path="/cart"
              element={
                <RequireAuth>
                  <CartPage />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="/order/complete/:orderId"
              element={
                <RequireAuth>
                  <OrderCompletePage />
                </RequireAuth>
              }
            />
            <Route
              path="/order/failed"
              element={
                <RequireAuth>
                  <OrderFailedPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-info"
              element={
                <RequireAuth>
                  <MyInfoPage />
                </RequireAuth>
              }
            />
            <Route
              path="/mypage"
              element={
                <RequireAuth>
                  <MyPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-reviews"
              element={
                <RequireAuth>
                  <MyReviewsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/seller"
              element={
                <RequireSeller>
                  <SellerPage />
                </RequireSeller>
              }
            />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
