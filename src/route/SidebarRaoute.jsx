import { lazy } from "react";
import {
  FaTachometerAlt, FaTruck, FaUserTie, FaCar, FaUsers,
  FaBell, FaUserShield, FaWallet, FaRoute, FaCarSide,
  FaAddressCard, FaSitemap, FaMap
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

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/fleet/create", component: CreateFleet, name: "Create Fleet", icon: FaTruck },
  { path: "/agent/create", component: CreateAgent, name: "Create Agent", icon: FaUserTie },
  { path: "/fleet/manage-registry", component: ManageFleetRegistry, name: "Manage Fleet Data ", icon: FaSitemap },
  { path: "/drivers/manage", component: ManageDrivers, name: "Main Drivers", icon: FaCar },
  { path: "/tracking/live", component: LiveTracking, name: "Live Tracking", icon: FaMap },
  { path: "/support", component: Support, name: "Support", icon: FaBell },
  { path: "/users/manage", component: ManageUsers, name: "Manage Users", icon: FaUsers },
  { path: "/notifications/manage", component: ManageNotifications, name: "Announcements", icon: FaBell },
  { path: "/wallet/manage", component: WalletManagement, name: "Wallet & Payouts", icon: FaWallet },
  { path: "/bookings/manage", component: ManageBookings, name: "Manage Bookings", icon: FaRoute },
  { path: "/car-categories/manage", component: ManageCarCategories, name: "CarCategargary", icon: FaCar },
  { path: "/admin/profile", component: AdminProfile, name: "Profile", icon: FaUserShield },
  { path: "/reports", component: Reports, name: "Reports", icon: FaTachometerAlt },
];

export default routes;
