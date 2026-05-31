import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { StorePage } from '@/pages/store/StorePage'
import { ProductPage } from '@/pages/store/ProductPage'
import { AboutPage } from '@/pages/store/AboutPage'
import { ContactPage } from '@/pages/store/ContactPage'
import { HospitalGiftsPage } from '@/pages/store/HospitalGiftsPage'
import { HospitalDeliveryPage } from '@/pages/store/HospitalDeliveryPage'
import { CartPage } from '@/pages/CartPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CheckoutPage } from '@/pages/checkout/CheckoutPage'
import { OrderConfirmationPage } from '@/pages/checkout/OrderConfirmationPage'
import { ContaPage } from '@/pages/account/ContaPage'
import { OrderDetailPage } from '@/pages/account/OrderDetailPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminFretesPage } from '@/pages/admin/AdminFretesPage'
import { ProductList } from '@/pages/admin/products/ProductList'
import { ProductForm } from '@/pages/admin/products/ProductForm'
import { CategoryList } from '@/pages/admin/categories/CategoryList'
import { PromotionList } from '@/pages/admin/promotions/PromotionList'
import { PromotionForm } from '@/pages/admin/promotions/PromotionForm'
import { CouponList } from '@/pages/admin/coupons/CouponList'
import { CouponForm } from '@/pages/admin/coupons/CouponForm'
import { OrderList } from '@/pages/admin/orders/OrderList'
import { NewsletterPage } from '@/pages/admin/NewsletterPage'
import { TestimonialsPage } from '@/pages/admin/TestimonialsPage'
import { SettingsPage } from '@/pages/admin/settings/SettingsPage'
import { PaymentSettingsPage } from '@/pages/admin/settings/PaymentSettingsPage'
import { WebhooksPage } from '@/pages/admin/WebhooksPage'
import { CustomersPage } from '@/pages/admin/CustomersPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'
import { AuditPage } from '@/pages/admin/AuditPage'
import { ContentPage } from '@/pages/admin/ContentPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { MediaLibraryPage } from '@/pages/admin/MediaLibraryPage'
import { PostList } from '@/pages/admin/blog/PostList'
import { PostForm } from '@/pages/admin/blog/PostForm'
import { SupplyList } from '@/pages/admin/supplies/SupplyList'
import { SupplyDetail } from '@/pages/admin/supplies/SupplyDetail'
import { PDVPage } from '@/pages/admin/pdv/PDVPage'
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage'
import { BlogPage } from '@/pages/blog/BlogPage'
import { BlogPostPage } from '@/pages/blog/BlogPostPage'
import { PrivateRoute } from '@/components/features/PrivateRoute'
import { AdminRoute } from '@/components/features/AdminRoute'
import { GlobalLoader } from '@/components/layout/GlobalLoader'
import { useRouteLoader } from '@/hooks/useRouteLoader'

export default function App() {
  useRouteLoader()
  return (
    <>
    <GlobalLoader />
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/loja" element={<StorePage />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="/presentes-para-hospitais-maternidades" element={<HospitalGiftsPage />} />
      <Route path="/entrega-em-hospitais" element={<HospitalDeliveryPage />} />
      <Route path="/carrinho" element={<Layout><CartPage /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/conta" element={<PrivateRoute><ContaPage /></PrivateRoute>} />
      <Route path="/pedido/:id/detalhes" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/fretes" element={<AdminRoute><AdminFretesPage /></AdminRoute>} />
      <Route path="/admin/produtos" element={<AdminRoute><ProductList /></AdminRoute>} />
      <Route path="/admin/produtos/novo" element={<AdminRoute><ProductForm /></AdminRoute>} />
      <Route path="/admin/produtos/:id" element={<AdminRoute><ProductForm /></AdminRoute>} />
      <Route path="/admin/categorias" element={<AdminRoute><CategoryList /></AdminRoute>} />
      <Route path="/admin/promocoes" element={<AdminRoute><PromotionList /></AdminRoute>} />
      <Route path="/admin/promocoes/nova" element={<AdminRoute><PromotionForm /></AdminRoute>} />
      <Route path="/admin/promocoes/:id" element={<AdminRoute><PromotionForm /></AdminRoute>} />
      <Route path="/admin/cupons" element={<AdminRoute><CouponList /></AdminRoute>} />
      <Route path="/admin/cupons/novo" element={<AdminRoute><CouponForm /></AdminRoute>} />
      <Route path="/admin/cupons/:id" element={<AdminRoute><CouponForm /></AdminRoute>} />
      <Route path="/admin/pedidos" element={<AdminRoute><OrderList /></AdminRoute>} />
      <Route path="/admin/newsletter" element={<AdminRoute><NewsletterPage /></AdminRoute>} />
      <Route path="/admin/depoimentos" element={<AdminRoute><TestimonialsPage /></AdminRoute>} />
      <Route path="/admin/configuracoes" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      <Route path="/admin/pagamentos" element={<AdminRoute><PaymentSettingsPage /></AdminRoute>} />
      <Route path="/admin/webhooks" element={<AdminRoute><WebhooksPage /></AdminRoute>} />
      <Route path="/admin/clientes" element={<AdminRoute><CustomersPage /></AdminRoute>} />
      <Route path="/admin/estoque" element={<AdminRoute><InventoryPage /></AdminRoute>} />
      <Route path="/admin/auditoria" element={<AdminRoute><AuditPage /></AdminRoute>} />
      <Route path="/admin/conteudo" element={<AdminRoute><ContentPage /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
      <Route path="/admin/midias" element={<AdminRoute><MediaLibraryPage /></AdminRoute>} />
      <Route path="/admin/blog" element={<AdminRoute><PostList /></AdminRoute>} />
      <Route path="/admin/blog/novo" element={<AdminRoute><PostForm /></AdminRoute>} />
      <Route path="/admin/blog/:id" element={<AdminRoute><PostForm /></AdminRoute>} />
      <Route path="/admin/suprimentos" element={<AdminRoute><SupplyList /></AdminRoute>} />
      <Route path="/admin/suprimentos/:id" element={<AdminRoute><SupplyDetail /></AdminRoute>} />
      <Route path="/admin/pdv" element={<AdminRoute><PDVPage /></AdminRoute>} />
      <Route path="/admin/analises" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
    </Routes>
    </>
  )
}
