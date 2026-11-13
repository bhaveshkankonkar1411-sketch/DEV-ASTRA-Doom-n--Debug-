import React from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

export const MainLayout = ({ children }) => {
  return (
    <div className="layout main-layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;

