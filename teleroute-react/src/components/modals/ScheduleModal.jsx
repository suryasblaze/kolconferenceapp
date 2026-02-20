import { useState, useEffect, useMemo } from 'react';
import { X } from '@phosphor-icons/react';
import useStore from '../../store/useStore';

export default function ScheduleModal() {
  const {
    scheduleModalOpen,
    closeScheduleModal,
    schedulingCompanyId,
    companies,
    addMeeting,
    saveSingleMeetingToSupabase,
    showToast
  } = useStore();

  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    scheduledBy: ''
  });

  const company = companies.find(c => c.id === schedulingCompanyId);

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (scheduleModalOpen) {
      // Set default time to next hour
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const startHour = String(nextHour.getHours()).padStart(2, '0');
      const endHour = String(Math.min(nextHour.getHours() + 1, 23)).padStart(2, '0');

      setFormData({
        date: today,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
        subject: '',
        scheduledBy: ''
      });
    }
  }, [scheduleModalOpen, today]);

  if (!scheduleModalOpen || !company) return null;

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const validateDateTime = () => {
    const selectedDate = formData.date;
    const startTime = formData.startTime;
    const endTime = formData.endTime;

    // Check if date is in the past
    if (selectedDate < today) {
      showToast('Cannot schedule meeting in the past', 'error');
      return false;
    }

    // If date is today, check if start time is in the past
    if (selectedDate === today) {
      const currentTime = getCurrentTime();
      if (startTime < currentTime) {
        showToast('Start time cannot be in the past', 'error');
        return false;
      }
    }

    // Check if end time is after start time
    if (endTime && endTime <= startTime) {
      showToast('End time must be after start time', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!formData.date) {
      showToast('Please select a date', 'error');
      return;
    }
    if (!formData.scheduledBy) {
      showToast('Please enter your email', 'error');
      return;
    }
    if (!formData.scheduledBy.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    // Validate date and time
    if (!validateDateTime()) {
      return;
    }

    const meeting = {
      id: `meeting_${Date.now()}`,
      companyId: schedulingCompanyId,
      companyName: company.name,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      serviceType: company.serviceType,
      status: 'scheduled',
      subject: formData.subject,
      contactPerson: company.contactPerson || '',
      email: company.email || '',
      phone: company.phone || '',
      skype: company.skype || '',
      whatsapp: company.whatsapp || '',
      scheduledBy: formData.scheduledBy,
      strongRegion: '',
      lookingFor: '',
      notes: '',
      activeStatus: '',
      reason: '',
      payable: '',
      dealProposals: '',
      routeIssue: '',
      files: [],
      linkedRates: [],
      clientOffers: []
    };

    addMeeting(meeting);
    await saveSingleMeetingToSupabase(meeting);

    showToast('Meeting scheduled successfully', 'success');
    closeScheduleModal();
  };

  // Get minimum time based on selected date
  const getMinTime = () => {
    if (formData.date === today) {
      return getCurrentTime();
    }
    return '00:00';
  };

  return (
    <div className="schedule-modal show">
      <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="text-lg font-bold text-slate-800">Schedule Meeting</h3>
          <button onClick={closeScheduleModal} className="p-2 text-slate-400 hover:text-slate-600">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="modal-body">
          {/* Company Info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
            <div className="company-avatar">
              {getInitials(company.name)}
            </div>
            <div>
              <p className="font-bold text-slate-800">{company.name}</p>
              <p className="text-xs text-slate-500">{company.email || company.phone || ''}</p>
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Meeting Date *</label>
            <input
              type="date"
              value={formData.date}
              min={today}
              onChange={(e) => {
                let newDate = e.target.value;

                // Prevent past dates
                if (newDate < today) {
                  showToast('Cannot select past date', 'error');
                  newDate = today;
                }

                // If switching to today, check if start time is still valid
                let newStartTime = formData.startTime;
                let newEndTime = formData.endTime;

                if (newDate === today) {
                  const currentTime = getCurrentTime();
                  if (newStartTime < currentTime) {
                    // Reset to next hour
                    const now = new Date();
                    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
                    newStartTime = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
                    newEndTime = `${String(Math.min(nextHour.getHours() + 1, 23)).padStart(2, '0')}:00`;
                  }
                }

                setFormData({
                  ...formData,
                  date: newDate,
                  startTime: newStartTime,
                  endTime: newEndTime
                });
              }}
            />
          </div>

          {/* Time */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                min={getMinTime()}
                onChange={(e) => {
                  let newStart = e.target.value;

                  // If date is today, prevent past times
                  if (formData.date === today) {
                    const currentTime = getCurrentTime();
                    if (newStart < currentTime) {
                      showToast('Cannot select past time', 'error');
                      // Reset to next hour
                      const now = new Date();
                      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
                      newStart = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
                    }
                  }

                  // Auto-adjust end time to be 1 hour after start
                  const [hours] = newStart.split(':').map(Number);
                  const newEndHour = String(Math.min(hours + 1, 23)).padStart(2, '0');
                  setFormData({
                    ...formData,
                    startTime: newStart,
                    endTime: `${newEndHour}:00`
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={formData.endTime}
                min={formData.startTime}
                onChange={(e) => {
                  let newEnd = e.target.value;

                  // Ensure end time is after start time
                  if (newEnd <= formData.startTime) {
                    showToast('End time must be after start time', 'error');
                    // Reset to 1 hour after start
                    const [hours] = formData.startTime.split(':').map(Number);
                    newEnd = `${String(Math.min(hours + 1, 23)).padStart(2, '0')}:00`;
                  }

                  setFormData({ ...formData, endTime: newEnd });
                }}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label>Subject (optional)</label>
            <input
              type="text"
              placeholder="e.g., Rate Discussion, Contract Review"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          {/* Scheduled By */}
          <div className="form-group">
            <label>Scheduled By (Your Email) *</label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={formData.scheduledBy}
              onChange={(e) => setFormData({ ...formData, scheduledBy: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={closeScheduleModal}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
