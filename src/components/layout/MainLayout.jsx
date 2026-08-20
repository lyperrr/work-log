import React from 'react';
import { TooltipProvider } from '../ui/tooltip';
import { Navbar } from './Navbar';

export function MainLayout({ children, activeTab, setActiveTab }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-all duration-200">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-28 md:pb-12">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
