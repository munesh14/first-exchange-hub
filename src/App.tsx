import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { Layout } from "@/components/Layout";

// Eager load frequently used pages for better UX
import Dashboard from "./pages/Dashboard";
import ChainList from "./pages/ChainList";
import LPOList from "./pages/LPOList";
import QuotationList from "./pages/QuotationList";
import InvoiceList from "./pages/InvoiceList";

// Lazy load less frequently used pages
const ChainDetail = lazy(() => import("./pages/ChainDetail"));
const UploadInvoice = lazy(() => import("./pages/UploadInvoice"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const PendingReview = lazy(() => import("./pages/PendingReview"));
const QuotationUpload = lazy(() => import("./pages/QuotationUpload"));
const QuotationDetail = lazy(() => import("./pages/QuotationDetail"));
const LPOUpload = lazy(() => import("./pages/LPOUpload"));
const LPODetail = lazy(() => import("./pages/LPODetail"));
const PendingApprovals = lazy(() => import("./pages/PendingApprovals"));
const DeliveryOrderList = lazy(() => import("./pages/DeliveryOrderList"));
const DeliveryOrderDetail = lazy(() => import("./pages/DeliveryOrderDetail"));
const RecordPayment = lazy(() => import("./pages/RecordPayment"));
const PDCTracker = lazy(() => import("./pages/PDCTracker"));
const AssetList = lazy(() => import("./pages/AssetList"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const PendingAssets = lazy(() => import("./pages/PendingAssets"));
const Reports = lazy(() => import("./pages/Reports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Data stays fresh for 1 minute
      gcTime: 5 * 60 * 1000, // Cache persists for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry failed requests once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }>
            <Routes>
              <Route element={<Layout />}>
                {/* Dashboard */}
                <Route path="/" element={<Dashboard />} />

                {/* Procurement Chains */}
                <Route path="/chains" element={<ChainList />} />
                <Route path="/chains/:uuid" element={<ChainDetail />} />

                {/* Invoices */}
                <Route path="/upload" element={<UploadInvoice />} />
                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/invoices/:invoiceUuid" element={<InvoiceDetail />} />
                <Route path="/pending" element={<PendingReview />} />

                {/* Quotations */}
                <Route path="/quotations" element={<QuotationList />} />
                <Route path="/quotations/upload" element={<QuotationUpload />} />
                <Route path="/quotations/:uuid" element={<QuotationDetail />} />

                {/* LPOs */}
                <Route path="/lpo" element={<LPOList />} />
                <Route path="/lpo/new" element={<LPOUpload />} />
                <Route path="/lpo/pending" element={<PendingApprovals />} />
                <Route path="/lpo/:uuid" element={<LPODetail />} />

                {/* Delivery Orders */}
                <Route path="/delivery-orders" element={<DeliveryOrderList />} />
                <Route path="/delivery-orders/:uuid" element={<DeliveryOrderDetail />} />

                {/* Payments */}
                <Route path="/payments/new" element={<RecordPayment />} />
                <Route path="/payments/pdc" element={<PDCTracker />} />

                {/* Assets */}
                <Route path="/assets" element={<AssetList />} />
                <Route path="/asset/:uuid" element={<AssetDetail />} />
                <Route path="/assets/pending" element={<PendingAssets />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
