import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BrandIntro } from "@/components/brand/BrandIntro";
import AdminHub from "./pages/AdminHub";
import AdminLogin from "./pages/AdminLogin";
import Animation from "./pages/Animation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import VideoProduction from "./pages/VideoProduction";
import WebDevelopment from "./pages/WebDevelopment";
import { trackEvent } from "@/lib/analytics";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent("page_view", `${location.pathname}${location.search}`);
  }, [location]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <BrandIntro />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminHub />} />
            <Route path="/animation" element={<Animation />} />
            <Route path="/web-development" element={<WebDevelopment />} />
            <Route path="/video-production" element={<VideoProduction />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
