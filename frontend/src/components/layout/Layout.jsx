import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      <div 
        className={`
          flex-1 flex flex-col 
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'ml-20' : 'ml-80'}
        `}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="container-pro py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
