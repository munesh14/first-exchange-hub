import LPOList from './pages/LPOList';
import LPOCreate from './pages/LPOCreate';
import LPODetail from './pages/LPODetail';
import LPOUpload from '@/pages/LPOUpload';
import PendingApprovals from './pages/PendingApprovals';
import QuotationList from './pages/QuotationList';
import QuotationUpload from './pages/QuotationUpload';
import QuotationDetail from './pages/QuotationDetail';
import DeliveryOrderList from './pages/DeliveryOrderList';
import DeliveryOrderDetail from './pages/DeliveryOrderDetail';
import RecordPayment from './pages/RecordPayment';
import PDCTracker from './pages/PDCTracker';
import PendingAssets from './pages/PendingAssets';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import UploadInvoice from "./pages/UploadInvoice";
import InvoiceList from "./pages/InvoiceList";
import InvoiceDetail from "./pages/InvoiceDetail";
import PendingReview from "./pages/PendingReview";
import Reports from "./pages/Reports";
import AssetList from "./pages/AssetList";
import AssetDetail from "./pages/AssetDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Dashboard & Invoices */}
              <Route path="/" element={<Dashboard />} />
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
              <Route path="/lpo/create" element={<LPOCreate />} />
              <Route path="/lpo/upload" element={<LPOUpload />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
