import { lazy } from "react";
import {
  FaTachometerAlt, FaTruck, FaUserTie, FaCar, FaUsers,
  FaBell, FaUserShield, FaWallet, FaRoute, FaCarSide,
  FaAddressCard, FaSitemap, FaMap, FaStore, FaMapMarkerAlt, FaGlobe
} from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const CreateFleet = lazy(() => import("../pages/CreateFleet"));
const CreateAgent = lazy(() => import("../pages/CreateAgent"));
const ManageDrivers = lazy(() => import("../pages/ManageDrivers"));
const ManageUsers = lazy(() => import("../pages/ManageUsers"));
const ManageNotifications = lazy(() => import("../pages/ManageNotifications"));
const AdminProfile = lazy(() => import("../pages/AdminProfile"));
const WalletManagement = lazy(() => import("../pages/WalletManagement"));
const ManageBookings = lazy(() => import("../pages/ManageBookings"));
const ManageCarCategories = lazy(() => import("../pages/ManageCarCategories"));
const ManageFleetRegistry = lazy(() => import("../pages/ManageFleetRegistry"));
const Reports = lazy(() => import("../pages/Reports"));
const Support = lazy(() => import("../pages/Support"));
const LiveTracking = lazy(() => import("../pages/LiveTracking"));
const Vendor = lazy(() => import("../pages/Vendor"));
const ManageSubAdmins = lazy(() => import("../pages/ManageSubAdmins"));
const ManageAreaPricing = lazy(() => import("../pages/ManageAreaPricing"));
const ManageServiceAreas = lazy(() => import("../pages/ManageServiceAreas"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt, permission: "DASHBOARD_READ" },
  { path: "/fleet/create", component: CreateFleet, name: "Create Fleet", icon: FaTruck, permission: "FLEET_CREATE" },
  { path: "/agent/create", component: CreateAgent, name: "Create Agent", icon: FaUserTie, permission: "AGENT_CREATE" },
  { path: "/vendors/manage", component: Vendor, name: "Manage Vendors", icon: FaStore, permission: "VENDOR_READ" },
  { path: "/subadmins/manage", component: ManageSubAdmins, name: "Sub Admin", icon: FaUserShield, permission: "STAFF_VIEW" },
  { path: "/fleet/manage-registry", component: ManageFleetRegistry, name: "Manage Fleet Data ", icon: FaSitemap, permission: "FLEET_READ" },
  { path: "/drivers/manage", component: ManageDrivers, name: "Main Drivers", icon: FaCar, permission: "DRIVER_READ" },
  { path: "/tracking/live", component: LiveTracking, name: "Live Tracking", icon: FaMap, permission: "TRACKING_READ" },
  { path: "/support", component: Support, name: "Support", icon: FaBell, permission: "SUPPORT_READ" },
  { path: "/users/manage", component: ManageUsers, name: "Manage Users", icon: FaUsers, permission: "USER_READ" },
  { path: "/notifications/manage", component: ManageNotifications, name: "Announcements", icon: FaBell, permission: "NEWS_VIEW" },
  { path: "/wallet/manage", component: WalletManagement, name: "Wallet & Payouts", icon: FaWallet, permission: "TRANSACTION_READ" },
  { path: "/bookings/manage", component: ManageBookings, name: "Manage Bookings", icon: FaRoute, permission: "BOOKING_READ" },
  { path: "/car-categories/manage", component: ManageCarCategories, name: "CarCategargary", icon: FaCar, permission: "CAT_VIEW" },
  { path: "/service-areas/manage", component: ManageServiceAreas, name: "Service Areas", icon: FaGlobe, permission: "CAT_VIEW" },
  { path: "/pricing/area-wise", component: ManageAreaPricing, name: "Area Pricing", icon: FaMapMarkerAlt, permission: "CAT_VIEW" },
  { path: "/admin/profile", component: AdminProfile, name: "Profile", icon: FaUserShield },
  { path: "/reports", component: Reports, name: "Reports", icon: FaTachometerAlt, permission: "REPORT_READ" },
];

export default routes;
