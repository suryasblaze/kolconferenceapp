import {
  ChartLineUp,
  Buildings,
  DownloadSimple,
  UploadSimple,
  Calendar
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';

const tabs = [
  { id: 'rates', label: 'Rates', Icon: ChartLineUp },
  { id: 'companies', label: 'Companies', Icon: Buildings },
  { id: 'clientoffers', label: 'Client Offers', Icon: DownloadSimple },
  { id: 'ouroffers', label: 'Our Offers', Icon: UploadSimple },
  { id: 'meetings', label: 'Meetings', Icon: Calendar },
];

export default function BottomTabs() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="bottom-tabs safe-bottom">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`tab-btn ${activeTab === id ? 'active' : ''}`}
        >
          <Icon size={20} weight={activeTab === id ? 'fill' : 'regular'} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
