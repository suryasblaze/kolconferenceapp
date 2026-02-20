import { DeviceRotate, ArrowsOut } from '@phosphor-icons/react';
import useStore from '../../store/useStore';

export default function RotateOverlay() {
  const { activeTab, serviceType, listType, region, rotateOverlayDismissed, setRotateOverlayDismissed } = useStore();

  // Only show for rates tab when selection is complete
  const shouldShow = activeTab === 'rates' &&
    serviceType &&
    listType &&
    region &&
    !rotateOverlayDismissed &&
    window.innerWidth < window.innerHeight; // Portrait mode

  const handleAutoRotate = async () => {
    try {
      await document.documentElement.requestFullscreen();
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (err) {
      console.log('Fullscreen/rotation not supported');
    }
    setRotateOverlayDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className="rotate-overlay show landscape-hidden">
      <DeviceRotate size={64} className="rotate-icon" />
      <h2 className="text-xl font-bold mb-2">Better View Available</h2>
      <p className="text-sm text-slate-300 mb-6 max-w-[250px]">
        Rotate your device to landscape mode for the best table editing experience.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[250px]">
        <button
          onClick={handleAutoRotate}
          className="px-6 py-3 bg-[#3BC1A8] text-white rounded-xl font-semibold text-sm active:bg-[#249E94] flex items-center justify-center gap-2"
        >
          <ArrowsOut size={18} weight="bold" />
          Auto-Rotate (Fullscreen)
        </button>
        <button
          onClick={() => setRotateOverlayDismissed(true)}
          className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold text-sm active:bg-white/20"
        >
          Continue in Portrait
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-4">Auto-rotate requires fullscreen mode</p>
    </div>
  );
}
