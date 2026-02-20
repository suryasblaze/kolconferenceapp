import { useMemo, useCallback, memo } from 'react';
import {
  ChatText,
  Phone,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Clock,
  Paperclip,
  ListBullets,
  At
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { SkeletonMeetingsList } from '../ui/Skeleton';

// Memoized Meeting Block component
const MeetingBlock = memo(function MeetingBlock({ meeting, style, status, isShort, onOpen, formatTime }) {
  const serviceType = (meeting.serviceType || 'SMS').toUpperCase();

  return (
    <div
      className={`meeting-block ${status} ${isShort ? 'short' : ''}`}
      style={style}
      onClick={() => onOpen(meeting.id)}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
          serviceType === 'SMS'
            ? 'bg-emerald-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          {serviceType === 'SMS' ? <ChatText size={10} weight="bold" /> : <Phone size={10} weight="bold" />}
          {serviceType}
        </span>
        <span className="company flex-1">{meeting.companyName}</span>
      </div>
      <div className="time-range">
        <Clock size={10} />
        {formatTime(meeting.startTime)}
        {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
      </div>
      {meeting.scheduledBy && (
        <div className="scheduled-by flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
          <At size={10} weight="bold" />
          {meeting.scheduledBy}
        </div>
      )}
      <div className="meta-icons">
        {meeting.linkedRates?.length > 0 && (
          <span><ListBullets size={10} /> {meeting.linkedRates.length}</span>
        )}
        {meeting.files?.length > 0 && (
          <span><Paperclip size={10} /> {meeting.files.length}</span>
        )}
      </div>
    </div>
  );
});

export default function MeetingsTab() {
  const {
    meetings,
    meetingsServiceType,
    setMeetingsServiceType,
    currentMeetingDate,
    setCurrentMeetingDate,
    openCalendar,
    openMeetingModal,
    initialLoading
  } = useStore();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isToday = currentMeetingDate === todayStr;

  // Get meetings for current date and service type
  const dayMeetings = useMemo(() => {
    return meetings.filter(m => {
      const meetingType = (m.serviceType || 'SMS').toUpperCase();
      return m.date === currentMeetingDate && meetingType === meetingsServiceType;
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [meetings, currentMeetingDate, meetingsServiceType]);

  const formatTime = useCallback((timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }, []);

  const prevDay = useCallback(() => {
    const date = new Date(currentMeetingDate);
    date.setDate(date.getDate() - 1);
    setCurrentMeetingDate(date.toISOString().split('T')[0]);
  }, [currentMeetingDate, setCurrentMeetingDate]);

  const nextDay = useCallback(() => {
    const date = new Date(currentMeetingDate);
    date.setDate(date.getDate() + 1);
    setCurrentMeetingDate(date.toISOString().split('T')[0]);
  }, [currentMeetingDate, setCurrentMeetingDate]);

  const goToToday = useCallback(() => {
    setCurrentMeetingDate(todayStr);
  }, [todayStr, setCurrentMeetingDate]);

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 6; h <= 22; h++) {
      slots.push({
        hour: h,
        label: `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`
      });
    }
    return slots;
  }, []);

  // Calculate meeting positions
  const getMeetingStyle = useCallback((meeting) => {
    const [startH, startM] = meeting.startTime.split(':').map(Number);
    const [endH, endM] = (meeting.endTime || meeting.startTime).split(':').map(Number);

    const startMinutes = (startH - 6) * 60 + startM; // Offset from 6 AM
    const endMinutes = (endH - 6) * 60 + endM;
    const duration = Math.max(endMinutes - startMinutes, 30); // Min 30 minutes

    const hourHeight = 120; // Height of each hour in pixels
    const top = (startMinutes / 60) * hourHeight;
    const height = (duration / 60) * hourHeight;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 70)}px`, // Min height increased for email display
      left: '8px',
      right: '8px'
    };
  }, []);

  const getMeetingStatus = useCallback((meeting) => {
    if (meeting.notes || meeting.activeStatus) return 'completed';

    const now = new Date();
    const meetingDate = new Date(meeting.date + 'T' + meeting.startTime);
    const diff = (meetingDate - now) / (1000 * 60); // Difference in minutes

    if (diff <= 15 && diff > 0) return 'starting-soon';
    return '';
  }, []);

  const currentHour = useMemo(() => new Date().getHours(), []);

  // Check if meeting is short (less than 1 hour)
  const isShortMeeting = useCallback((meeting) => {
    return parseInt(meeting.endTime?.split(':')[0] || meeting.startTime.split(':')[0]) -
      parseInt(meeting.startTime.split(':')[0]) < 1;
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Service Type Toggle */}
        <div className="flex gap-2 p-3 border-b border-slate-100">
          {['SMS', 'VOICE'].map((type) => (
            <button
              key={type}
              onClick={() => setMeetingsServiceType(type)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                meetingsServiceType === type
                  ? 'bg-[#005461] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type === 'SMS' ? <ChatText size={16} /> : <Phone size={16} />}
              {type}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="date-nav p-3">
          <button onClick={prevDay}>
            <CaretLeft size={20} weight="bold" />
          </button>

          <button
            onClick={openCalendar}
            className="flex-1 text-center"
          >
            <div className="text-lg font-bold text-slate-800">
              {new Date(currentMeetingDate + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(currentMeetingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </button>

          <button onClick={nextDay}>
            <CaretRight size={20} weight="bold" />
          </button>

          {!isToday && (
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1 bg-[#3BC1A8] text-white rounded-lg text-xs font-semibold"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Timetable */}
      {initialLoading ? (
        <SkeletonMeetingsList />
      ) : (
      <div className="timetable flex-1">
        {/* Time Labels */}
        <div className="time-labels">
          {timeSlots.map(({ hour, label }) => (
            <div key={hour} className="time-label">
              {label}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="time-grid">
          {/* Grid Lines */}
          {timeSlots.map(({ hour }) => (
            <div
              key={hour}
              className={`time-grid-line ${isToday && hour === currentHour ? 'current-hour' : ''}`}
            />
          ))}

          {/* Meetings Layer */}
          <div className="meetings-layer">
            {dayMeetings.map((meeting) => (
              <MeetingBlock
                key={meeting.id}
                meeting={meeting}
                style={getMeetingStyle(meeting)}
                status={getMeetingStatus(meeting)}
                isShort={isShortMeeting(meeting)}
                onOpen={openMeetingModal}
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {dayMeetings.length} meetings
        </span>
        <span className="text-xs text-slate-400">
          Tap meeting to add notes
        </span>
      </div>
    </div>
  );
}
