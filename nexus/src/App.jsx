import { useEffect } from 'react';
import useStore from './store/useStore';
import Header from './components/layout/Header';
import BottomTabs from './components/layout/BottomTabs';
import RatesTab from './components/tabs/RatesTab';
import CompaniesTab from './components/tabs/CompaniesTab';
import MeetingsTab from './components/tabs/MeetingsTab';
import ClientOffersTab from './components/tabs/ClientOffersTab';
import OurOffersTab from './components/tabs/OurOffersTab';
import Toast from './components/ui/Toast';
import ImportModal from './components/modals/ImportModal';
import CalendarModal from './components/modals/CalendarModal';
import ScheduleModal from './components/modals/ScheduleModal';
import MeetingModal from './components/modals/MeetingModal';
import ComparisonModal from './components/modals/ComparisonModal';
import RotateOverlay from './components/ui/RotateOverlay';

function App() {
  const {
    activeTab,
    loadFromSupabase,
    toast,
    startMeetingReminders,
    stopMeetingReminders
  } = useStore();

  useEffect(() => {
    loadFromSupabase();
    // Start meeting reminder system
    startMeetingReminders();

    // Cleanup on unmount
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
        {renderTabContent()}
      </main>

      <BottomTabs />

      {/* Modals */}
      <ImportModal />
      <ComparisonModal />
      <CalendarModal />
      <ScheduleModal />
      <MeetingModal />
      <RotateOverlay />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
