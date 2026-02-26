import { useEffect, lazy, Suspense } from 'react';
import useStore from './store/useStore';
import Header from './components/layout/Header';
import BottomTabs from './components/layout/BottomTabs';
import Toast from './components/ui/Toast';
import RotateOverlay from './components/ui/RotateOverlay';
import PWAInstallBanner from './components/ui/PWAInstallBanner';

// Lazy load tab components - only loaded when user navigates to them
const RatesTab = lazy(() => import('./components/tabs/RatesTab'));
const CompaniesTab = lazy(() => import('./components/tabs/CompaniesTab'));
const MeetingsTab = lazy(() => import('./components/tabs/MeetingsTab'));
const ClientOffersTab = lazy(() => import('./components/tabs/ClientOffersTab'));
const OurOffersTab = lazy(() => import('./components/tabs/OurOffersTab'));

// Lazy load modals - only loaded when opened
const ImportModal = lazy(() => import('./components/modals/ImportModal'));
const CalendarModal = lazy(() => import('./components/modals/CalendarModal'));
const ScheduleModal = lazy(() => import('./components/modals/ScheduleModal'));
const MeetingModal = lazy(() => import('./components/modals/MeetingModal'));
const ComparisonModal = lazy(() => import('./components/modals/ComparisonModal'));

function App() {
  const {
    activeTab,
    loadFromSupabase,
    toast,
    startMeetingReminders,
    stopMeetingReminders,
    importModalOpen,
    calendarOpen,
    scheduleModalOpen,
    meetingModalOpen,
    comparisonModalOpen
  } = useStore();

  useEffect(() => {
    loadFromSupabase();
    startMeetingReminders();

    // Initialize push notification status
    useStore.getState().initPushNotifications();

    // Listen for service worker messages (e.g., notification click opens meeting)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'OPEN_MEETING') {
          useStore.getState().openMeetingModal(event.data.meetingId);
        }
      });
    }

    return () => {
      stopMeetingReminders();
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rates':
        return <RatesTab />;
      case 'companies':
        return <CompaniesTab />;
      case 'meetings':
        return <MeetingsTab />;
      case 'clientoffers':
        return <ClientOffersTab />;
      case 'ouroffers':
        return <OurOffersTab />;
      default:
        return <RatesTab />;
    }
  };

  return (
    <div className="app-container">
      {activeTab === 'rates' && <Header />}

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="loading-spinner" /></div>}>
          {renderTabContent()}
        </Suspense>
      </main>

      <BottomTabs />

      {/* Modals - only render when open */}
      <Suspense fallback={null}>
        {importModalOpen && <ImportModal />}
        {comparisonModalOpen && <ComparisonModal />}
        {calendarOpen && <CalendarModal />}
        {scheduleModalOpen && <ScheduleModal />}
        {meetingModalOpen && <MeetingModal />}
      </Suspense>
      <RotateOverlay />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
