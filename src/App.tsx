import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, isMerchantRole, isCourierRole } from "./store";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { ExplorePage } from "./pages/Explore";
import { MarketplacePage } from "./pages/Marketplace";
import { ProductPage } from "./pages/Product";
import { CartPage } from "./pages/Cart";
import { OrdersPage } from "./pages/Orders";
import { OrderTrackingPage } from "./pages/OrderTracking";
import { AuthPage } from "./pages/Auth";
import { ProfilePage } from "./pages/Profile";
import { AddressesPage } from "./pages/Addresses";
import { NotificationsPage } from "./pages/Notifications";
import { FavoritesPage } from "./pages/Favorites";
import { SettingsPage } from "./pages/Settings";
import { AccountSettingsPage } from "./pages/AccountSettings";
import { ProfileEditPage } from "./pages/ProfileEdit";
import { HelpCenterPage } from "./pages/HelpCenter";
import { DiscoverAllPage } from "./pages/DiscoverAll";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { PaymentMethodsPage } from "./pages/PaymentMethods";
import { OrderDeliveriesSummaryPage } from "./pages/OrderDeliveriesSummary";
import { HowMultiDelivery } from "./pages/HowMultiDelivery";
import { DeliveryDetail } from "./pages/DeliveryDetail";
import { PublicDeliveryTrack } from "./pages/PublicDeliveryTrack";

// Signup (WITHOUT layout — full screen, no header/nav)
import { SignupChoosePage as SignupChoose } from "./pages/signup/SignupChoose";
import { SignupClientPage as SignupClient } from "./pages/signup/SignupClient";
import { SignupRestaurantPage as SignupRestaurant } from "./pages/signup/SignupRestaurant";
import { SignupBoutiquePage as SignupBoutique } from "./pages/signup/SignupBoutique";

// Vendor
import { VendorLayout } from "./pages/vendor/VendorLayout";
import { VendorDashboard } from "./pages/vendor/VendorDashboard";
import { VendorCatalog } from "./pages/vendor/VendorCatalog";
import { VendorProducts } from "./pages/vendor/VendorProducts";
import { VendorOrders } from "./pages/vendor/VendorOrders";
import { VendorDeliveries } from "./pages/vendor/VendorDeliveries";
import { VendorMore } from "./pages/vendor/VendorMore";
import { VendorShopSettings } from "./pages/vendor/VendorShopSettings";
import { VendorShopInfo } from "./pages/vendor/VendorShopInfo";
import { VendorShopAddresses } from "./pages/vendor/VendorShopAddresses";
import { VendorShopPayments } from "./pages/vendor/VendorShopPayments";
import { VendorHoraires } from "./pages/vendor/VendorHoraires";
import { VendorCategories } from "./pages/vendor/VendorCategories";
import { VendorWallet } from "./pages/vendor/VendorWallet";
import { VendorStatistics } from "./pages/vendor/VendorStatistics";
import { VendorOrderDetail } from "./pages/vendor/VendorOrderDetail";
import { VendorAddProduct } from "./pages/vendor/VendorAddProduct";
import { VendorDeliveryDetail } from "./pages/vendor/VendorDeliveryDetail";
import { VendorPreparation } from "./pages/vendor/VendorPreparation";
import { VendorStock } from "./pages/vendor/VendorStock";
import { VendorCreateExternalDelivery } from "./pages/vendor/VendorCreateExternalDelivery";
import { VendorNotifications } from "./pages/vendor/VendorNotifications";
import { VendorHelpCenter } from "./pages/vendor/VendorHelpCenter";
import { VendorShare } from "./pages/vendor/VendorShare";

// Courier
import { CourierLayout } from "./pages/courier/CourierLayout";
import { CourierHome } from "./pages/courier/CourierHome";
import { CourierMissions } from "./pages/courier/CourierMissions";
import { CourierMissionDetail } from "./pages/courier/CourierMissionDetail";
import { CourierProfile } from "./pages/courier/CourierProfile";
import { CourierSettings } from "./pages/courier/CourierSettings";
import { CourierAccountSettings } from "./pages/courier/CourierAccountSettings";
import { CourierNotifications } from "./pages/courier/CourierNotifications";

// Logistics
import { LogisticsLayout } from "./pages/logistics/LogisticsLayout";
import { LogisticsHome } from "./pages/logistics/LogisticsHome";
import { LogisticsIncidents } from "./pages/logistics/LogisticsIncidents";
import { LogisticsNotifications } from "./pages/logistics/LogisticsNotifications";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/** Redirects vendor/courier away from client routes */
function ClientOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (isMerchantRole(user?.role)) return <Navigate to="/vendor" replace />;
  if (isCourierRole(user?.role)) return <Navigate to="/courier" replace />;
  return <>{children}</>;
}

/** Redirects client away from vendor routes */
function VendorOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isMerchantRole(user?.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Redirects client away from courier routes */
function CourierOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isCourierRole(user?.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Redirects non-logistics away from logistics routes */
function LogisticsOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== "gestionnaire_logistique" && user?.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Catches unknown routes and redirects to the correct home by role */
function RoleBasedRedirect() {
  const user = useAuthStore((s) => s.user);
  if (isMerchantRole(user?.role)) return <Navigate to="/vendor" replace />;
  if (isCourierRole(user?.role)) return <Navigate to="/courier" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ── PUBLIC (no layout, no header/nav) ─────────────────────────── */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Signup — full screen, no Layout chrome */}
      <Route path="/signup" element={<SignupChoose />} />
      <Route path="/signup/client" element={<SignupClient />} />
      <Route path="/signup/restaurant" element={<SignupRestaurant />} />
      <Route path="/signup/boutique" element={<SignupBoutique />} />

      {/* ── WITH CLIENT LAYOUT (header + bottom nav) — CLIENT ONLY ── */}
      <Route element={<ClientOnlyRoute><Layout /></ClientOnlyRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/all" element={<DiscoverAllPage />} />
        <Route path="/marketplace/:enterpriseId" element={<MarketplacePage />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/how-multi-delivery" element={<HowMultiDelivery />} />

        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/orders/:orderId/deliveries" element={<ProtectedRoute><OrderDeliveriesSummaryPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="/help-center" element={<ProtectedRoute><HelpCenterPage /></ProtectedRoute>} />
        <Route path="/delivery/track/:id" element={<PublicDeliveryTrack />} />
        <Route path="/delivery/:id" element={<ProtectedRoute><DeliveryDetail /></ProtectedRoute>} />
      </Route>

      {/* ── VENDOR (has its own layout) — VENDOR ONLY ────────────────── */}
      <Route path="/vendor" element={<VendorOnlyRoute><VendorLayout /></VendorOnlyRoute>}>
        <Route index element={<VendorDashboard />} />
        <Route path="catalog" element={<VendorCatalog />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="deliveries" element={<VendorDeliveries />} />
        <Route path="more" element={<VendorMore />} />
        <Route path="add-product" element={<VendorAddProduct />} />
        <Route path="edit-product/:productId" element={<VendorAddProduct />} />
        <Route path="shop-settings" element={<VendorShopSettings />} />
        <Route path="shop-info" element={<VendorShopInfo />} />
        <Route path="shop-addresses" element={<VendorShopAddresses />} />
        <Route path="shop-payments" element={<VendorShopPayments />} />
        <Route path="horaires" element={<VendorHoraires />} />
        <Route path="categories" element={<VendorCategories />} />
        <Route path="wallet" element={<VendorWallet />} />
        <Route path="statistics" element={<VendorStatistics />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="delivery/:id" element={<VendorDeliveryDetail />} />
        <Route path="preparation" element={<VendorPreparation />} />
        <Route path="stock" element={<VendorStock />} />
        <Route path="create-delivery" element={<VendorCreateExternalDelivery />} />
        <Route path="notifications" element={<VendorNotifications />} />
        <Route path="share" element={<VendorShare />} />
        <Route path="help-center" element={<VendorHelpCenter />} />
      </Route>

      {/* ── COURIER (has its own layout) — COURIER ONLY ──────────────── */}
      <Route path="/courier" element={<CourierOnlyRoute><CourierLayout /></CourierOnlyRoute>}>
        <Route index element={<CourierHome />} />
        <Route path="missions" element={<CourierMissions />} />
        <Route path="missions/:missionId" element={<CourierMissionDetail />} />
        <Route path="profile" element={<CourierProfile />} />
        <Route path="profile/edit" element={<CourierProfile />} />
        <Route path="settings" element={<CourierSettings />} />
        <Route path="account-settings" element={<CourierAccountSettings />} />
        <Route path="notifications" element={<CourierNotifications />} />
        <Route path="help-center" element={<VendorHelpCenter />} />
      </Route>

      {/* ── LOGISTICS (has its own layout) — LOGISTICS MANAGER ONLY ── */}
      <Route path="/logistics" element={<LogisticsOnlyRoute><LogisticsLayout /></LogisticsOnlyRoute>}>
        <Route index element={<LogisticsHome />} />
        <Route path="incidents" element={<LogisticsIncidents />} />
        <Route path="notifications" element={<LogisticsNotifications />} />
      </Route>

      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );
}
