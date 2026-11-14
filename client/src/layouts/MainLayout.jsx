import React from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

export const MainLayout = ({ children }) => {
  return (
    <div className="legacy-layout main-layout">
      <Navbar />
      <div className="legacy-layout-body">
        <Sidebar />
        <main className="legacy-layout-content">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;

