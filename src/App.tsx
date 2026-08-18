import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './state/libraryStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { SeatMapGrid } from './components/seatmap/SeatMapGrid';
import { MemberList } from './components/members/MemberList';
import { AddMemberModal } from './components/members/AddMemberModal';
import { MemberDetailModal } from './components/members/MemberDetailModal';
import { MemberTransferModal } from './components/members/MemberTransferModal';
import { QRGateSimulator } from './components/gate/QRGateSimulator';
import { StudentPortalView } from './components/memberportal/StudentPortalView';
import { PaymentsView } from './components/finance/PaymentsView';
import { ExpensesView } from './components/finance/ExpensesView';
import { ShiftManager } from './components/shifts/ShiftManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { VerificationSuite } from './components/testrunner/VerificationSuite';
import { SettingsView } from './components/settings/SettingsView';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // Modals
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [selectedMemberDetailId, setSelectedMemberDetailId] = useState<string | null>(null);
  const [transferMemberId, setTransferMemberId] = useState<string | null>(null);

  const handleOpenMemberDetail = (memberId: string) => {
    setSelectedMemberDetailId(memberId);
  };

  return (
    <div className="app-container">
      {/* Left Desktop Sidebar (>=1024px) */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Main Container */}
      <div className="main-content">
        {/* Top Header */}
        <Header
          onOpenAddMember={() => setShowAddMember(true)}
          onNavigate={(view) => setCurrentView(view)}
        />

        {/* Dynamic Body Content */}
        <main className="content-body">
          {currentView === 'dashboard' && (
            <AdminDashboard
              onNavigate={(view) => setCurrentView(view)}
              onOpenMemberDetail={handleOpenMemberDetail}
              onOpenAddMember={() => setShowAddMember(true)}
            />
          )}

          {currentView === 'seatmap' && (
            <SeatMapGrid
              onOpenMemberDetail={handleOpenMemberDetail}
            />
          )}

          {currentView === 'members' && (
            <MemberList
              onOpenAddMember={() => setShowAddMember(true)}
              onOpenMemberDetail={handleOpenMemberDetail}
            />
          )}

          {currentView === 'shifts' && (
            <ShiftManager />
          )}

          {currentView === 'gate' && (
            <QRGateSimulator />
          )}

          {currentView === 'payments' && (
            <PaymentsView />
          )}

          {currentView === 'expenses' && (
            <ExpensesView />
          )}

          {currentView === 'studentportal' && (
            <StudentPortalView />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'tests' && (
            <VerificationSuite />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Role-Aware Mobile Bottom Navigation (<1024px) */}
        <BottomNav
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenAddMember={() => setShowAddMember(true)}
        />
      </div>

      {/* Onboarding Wizard Modal */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={(memberId) => {
            setSelectedMemberDetailId(memberId);
          }}
        />
      )}

      {/* Member Profile Drawer Modal */}
      {selectedMemberDetailId && (
        <MemberDetailModal
          memberId={selectedMemberDetailId}
          onClose={() => setSelectedMemberDetailId(null)}
          onOpenTransferBranch={(memberId) => {
            setSelectedMemberDetailId(null);
            setTransferMemberId(memberId);
          }}
        />
      )}

      {/* Inter-Branch Transfer Modal */}
      {transferMemberId && (
        <MemberTransferModal
          memberId={transferMemberId}
          onClose={() => setTransferMemberId(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}
