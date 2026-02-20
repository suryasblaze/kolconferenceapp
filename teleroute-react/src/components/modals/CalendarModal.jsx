import { useMemo } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import useStore from '../../store/useStore';

export default function CalendarModal() {
  const {
    calendarOpen,
    closeCalendar,
    calendarViewMonth,
    calendarViewYear,
    setCalendarView,
    currentMeetingDate,
    setCurrentMeetingDate,
    meetings,
    meetingsServiceType
  } = useStore();

  if (!calendarOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get dates with meetings (case-insensitive serviceType comparison)
  const datesWithMeetings = useMemo(() => {
    const dates = new Set();
    meetings
      .filter(m => (m.serviceType || 'SMS').toUpperCase() === meetingsServiceType)
      .forEach(m => dates.add(m.date));
    return dates;
  }, [meetings, meetingsServiceType]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(calendarViewYear, calendarViewMonth, 1);
    const lastDay = new Date(calendarViewYear, calendarViewMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    // Previous month days
    const prevMonthLastDay = new Date(calendarViewYear, calendarViewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(calendarViewYear, calendarViewMonth - 1, day);
      days.push({
        day,
        date: formatDateStr(date),
        otherMonth: true
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(calendarViewYear, calendarViewMonth, day);
      days.push({
        day,
        date: formatDateStr(date),
        otherMonth: false
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(calendarViewYear, calendarViewMonth + 1, day);
      days.push({
        day,
        date: formatDateStr(date),
        otherMonth: true
      });
    }

    return days;
  }, [calendarViewMonth, calendarViewYear]);

  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const prevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarView(11, calendarViewYear - 1);
    } else {
      setCalendarView(calendarViewMonth - 1, calendarViewYear);
    }
  };

  const nextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarView(0, calendarViewYear + 1);
    } else {
      setCalendarView(calendarViewMonth + 1, calendarViewYear);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarView(today.getMonth(), today.getFullYear());
    setCurrentMeetingDate(todayStr);
    closeCalendar();
  };

  const selectDate = (dateStr) => {
    setCurrentMeetingDate(dateStr);
    closeCalendar();
  };

  return (
    <div className="calendar-overlay show" onClick={closeCalendar}>
      <div className="calendar-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="calendar-header">
          <button onClick={prevMonth}>
            <CaretLeft size={20} weight="bold" />
          </button>
          <span className="calendar-title">
            {monthNames[calendarViewMonth]} {calendarViewYear}
          </span>
          <button onClick={nextMonth}>
            <CaretRight size={20} weight="bold" />
          </button>
        </div>

        {/* Weekdays */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="calendar-days">
          {calendarDays.map(({ day, date, otherMonth }, idx) => {
            const isToday = date === todayStr;
            const isSelected = date === currentMeetingDate;
            const hasMeeting = datesWithMeetings.has(date);

            return (
              <button
                key={idx}
                onClick={() => selectDate(date)}
                className={`calendar-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasMeeting ? 'has-meeting' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="calendar-footer">
          <button className="btn-cancel" onClick={closeCalendar}>
            Cancel
          </button>
          <button className="btn-today" onClick={goToToday}>
            Go to Today
          </button>
        </div>
      </div>
    </div>
  );
}
