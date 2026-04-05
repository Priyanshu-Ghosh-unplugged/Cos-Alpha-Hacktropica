import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FloatingPet } from "@/components/FloatingPet";
import { Taskbar } from "@/components/Taskbar";
import { HealthDashboard } from "@/components/HealthDashboard";
import { SuperPlaneDashboard } from "@/components/SuperPlaneDashboard";
import { UnifiedWalletProvider } from "@/contexts/UnifiedWalletContext";
import Index from "./pages/Index";
import Algorand from "./pages/Algorand";
import MultiChain from "./pages/MultiChain";
import MongoDB from "./pages/MongoDB";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UnifiedWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Taskbar />
        <FloatingPet pets={[]} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/health" element={<HealthDashboard />} />
            <Route path="/superplane" element={<SuperPlaneDashboard />} />
            <Route path="/multichain" element={<MultiChain />} />
            <Route path="/mongo" element={<MongoDB />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UnifiedWalletProvider>
  </QueryClientProvider>
);

export default App;
