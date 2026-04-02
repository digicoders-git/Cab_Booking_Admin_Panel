import { lazy } from "react";
import { FaTachometerAlt } from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
];

export default routes;
