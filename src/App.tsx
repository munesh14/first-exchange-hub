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
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadInvoice />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoice/:uuid" element={<InvoiceDetail />} />
              <Route path="/pending" element={<PendingReview />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/assets" element={<AssetList />} />
              <Route path="/asset/:uuid" element={<AssetDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
