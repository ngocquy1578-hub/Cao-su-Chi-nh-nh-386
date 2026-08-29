import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("@/pages/Home"));
const PlotsPage = lazy(() => import("@/pages/PlotsPage"));
const ImportsPage = lazy(() => import("@/pages/ImportsPage"));
const ExportsPage = lazy(() => import("@/pages/ExportsPage"));
const WorkforcePage = lazy(() => import("@/pages/WorkforcePage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const DataToolsPage = lazy(() => import("@/pages/DataToolsPage"));
const WarehouseLossPage = lazy(() => import("@/pages/WarehouseLossPage"));
const CareOperationsPage = lazy(() => import("@/pages/CareOperationsPage"));
const ProductionChangePage = lazy(() => import("@/pages/ProductionChangePage"));
const PlotProductionPage = lazy(() => import("@/pages/PlotProductionPage"));
const AccountsPage = lazy(() => import("@/pages/AccountsPage"));
const ActivityLogPage = lazy(() => import("@/pages/ActivityLogPage"));
const InstallAppPage = lazy(() => import("@/pages/InstallAppPage"));

function ScreenLoader() {
  return <div className="grid min-h-[60vh] place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-700 border-r-transparent" /></div>;
}

function Router() {
  const [location] = useLocation();
  if (location === "/install") return <Suspense fallback={<ScreenLoader />}><InstallAppPage /></Suspense>;
  return <DashboardLayout><Suspense fallback={<ScreenLoader />}><Switch>
    <Route path="/" component={Home} />
    <Route path="/plots" component={PlotsPage} />
    <Route path="/imports" component={ImportsPage} />
    <Route path="/exports" component={ExportsPage} />
    <Route path="/care"><Redirect to="/care-operations" /></Route>
    <Route path="/workforce" component={WorkforcePage} />
    <Route path="/reports" component={ReportsPage} />
    <Route path="/data-tools" component={DataToolsPage} />
    <Route path="/warehouse-loss" component={WarehouseLossPage} />
    <Route path="/care-operations" component={CareOperationsPage} />
    <Route path="/production-change" component={ProductionChangePage} />
    <Route path="/plot-production" component={PlotProductionPage} />
    <Route path="/accounts" component={AccountsPage} />
    <Route path="/activity-log" component={ActivityLogPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense></DashboardLayout>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
