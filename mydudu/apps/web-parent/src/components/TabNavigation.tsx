'use client';

import { MoreHorizontal } from 'lucide-react';

export interface TabNavigationProps {
  activeTab: 'home' | 'history' | 'more';
  onTabChange: (tab: 'home' | 'history' | 'more') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .nav-container {
          background: #ffffff;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
          padding: 0 16px 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 100%;
          margin: 0 auto;
          position: relative;
          height: 80px;
          animation: slideUp 0.3s ease-out;
        }
        
        .nav-slot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 64px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .nav-spacer {
          width: 20%;
          flex-shrink: 0;
        }
        
        .nav-slot:hover {
          transform: scale(1.05);
        }
        
        .nav-slot.center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%) translateY(-24px);
          flex: none;
          width: auto;
          height: auto;
          z-index: 10;
        }
        
        .nav-cutout {
          position: absolute;
          top: 36px; /* Half of the 72px main button */
          left: 50%;
          transform: translateX(-50%);
          width: 80%; /* 72px + 20% */
          height: 43px; /* Bottom half only */
          background-color: #f3f4f6; /* Slightly darker white */
          border-bottom-left-radius: 43px;
          border-bottom-right-radius: 43px;
          z-index: 0;
        }
        
        .nav-icon-container {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          transition: all 0.2s ease;
          color: #8b8b8b;
        }
        
        .nav-slot.center .nav-icon-container {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: 2px solid #000000;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
          z-index: 1;
        }

        .nav-slot.center:hover .nav-icon-container {
          transform: scale(1.1);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
        }

        .nav-slot.center:active .nav-icon-container {
          transform: scale(0.95);
        }
        
        .nav-slot.center .nav-icon-container img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }
        
        .nav-label {
          font-size: 11px;
          font-weight: 500;
          color: #8b8b8b;
          margin-top: 4px;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }
        
        .nav-slot.active .nav-icon-container {
          background: #000000;
          color: #ffffff;
        }
        
        .nav-slot.active .nav-label {
          color: #000000;
          font-weight: 600;
        }
        
        .nav-slot.side {
          padding-top: 8px;
        }
        
        .nav-slot.side.active .nav-icon-container {
          background: rgba(0, 0, 0, 0.08);
          color: #000000;
        }
      `}</style>

      <div className="nav-container max-w-md">
        {/* Left Slot - Riwayat */}
        <div
          className={`nav-slot side ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          <div className="nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="nav-label">Riwayat</div>
        </div>

        {/* Center Spacer for 20% responsive space */}
        <div className="nav-spacer"></div>

        {/* Center Slot - Home (Floating) */}
        <div
          className={`nav-slot center ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
        >
          <div className="nav-cutout"></div>
          <div className="nav-icon-container text-white">
            <img src="/logo_mydudu.png" alt="Homepage" />
          </div>
        </div>

        {/* Right Slot - More */}
        <div
          className={`nav-slot side ${activeTab === 'more' ? 'active' : ''}`}
          onClick={() => onTabChange('more')}
        >
          <div className="nav-icon-container">
            <MoreHorizontal size={24} strokeWidth={2.5} />
          </div>
          <div className="nav-label">Lainnya</div>
        </div>
      </div>
    </div>
  );
}
