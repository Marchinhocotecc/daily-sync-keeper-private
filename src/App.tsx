import React from 'react'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoggedI18nProvider from '@/providers/LoggedI18nProvider'
import { AppRoutes } from '@/routes/AppRoutes'

const App: React.FC = () => {
  return (
    <LoggedI18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </LoggedI18nProvider>
  )
}

export default App
