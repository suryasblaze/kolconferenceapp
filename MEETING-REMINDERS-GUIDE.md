# Meeting Reminders Feature

The app now includes automatic meeting reminders to notify you when meetings are approaching!

## How It Works

### Automatic Notifications

The app checks for upcoming meetings every minute and sends notifications at these intervals:

1. **15 Minutes Before** 📅 - Regular reminder notification
2. **5 Minutes Before** ⚠️ - Urgent reminder notification
3. **Meeting Starting Now** 🔔 - Immediate notification

### Notification Types

**Browser Notifications** (Desktop/Mobile)
- Pop-up notifications outside the browser
- Click notification to jump directly to meeting details
- Persistent urgent notifications require action to dismiss

**In-App Toast Notifications**
- Slide-down notifications within the app
- Color-coded by urgency (blue for regular, amber for urgent)
- Auto-dismiss after a few seconds

**Visual Calendar Indicators**
- Meeting blocks glow with amber border when approaching
- Pulsing animation for upcoming meetings
- Easy visual identification in calendar view

## Setup

### Enable Browser Notifications

**First Time:**
1. Open the app
2. Browser will ask: "Allow notifications?"
3. Click **Allow**

**If You Missed It:**
1. Click the lock/info icon in browser address bar
2. Find "Notifications" setting
3. Change to **Allow**

**Different Browsers:**

- **Chrome**: Click 🔒 in address bar → Site Settings → Notifications → Allow
- **Firefox**: Click 🔒 in address bar → Permissions → Allow Notifications
- **Safari**: Safari → Preferences → Websites → Notifications → Allow
- **Edge**: Click 🔒 in address bar → Permissions → Notifications → Allow

## Features

### Smart Notification Tracking
- No duplicate notifications for the same meeting
- Separate notifications at 15min, 5min, and start time
- Notifications reset when app restarts

### One-Click Meeting Access
- Click any browser notification to:
  - Bring app to focus
  - Switch to Meetings tab
  - Open meeting details modal
  - View all meeting information

### Multi-Day Support
- Only notifies for today's meetings
- Automatically updates when date changes
- Works across different time zones

## Notification Details

### What You'll See

**15-Minute Reminder:**
```
📅 Upcoming Meeting
SMS meeting with ABC Company in 15 minutes
```

**5-Minute Reminder:**
```
⚠️ Meeting in 5 minutes
Voice meeting with XYZ Corp
```

**Starting Now:**
```
🔔 Meeting Starting Now!
SMS meeting with ABC Company is starting
```

## Privacy & Permissions

### What We Access
- **Time**: To calculate when meetings are approaching
- **Notification API**: To send browser notifications
- **Nothing else**: No location, camera, or other data

### Data Storage
- Notification preferences stored in browser
- No notification data sent to servers
- Meeting data already in your Supabase account

## Troubleshooting

### Not Getting Notifications?

1. **Check Browser Permission**
   - Look for 🔒 in address bar
   - Ensure notifications are **Allowed**

2. **Check Browser Settings**
   - System Settings → Notifications
   - Make sure browser can send notifications

3. **Check Do Not Disturb**
   - Windows: Turn off Focus Assist
   - Mac: Turn off Do Not Disturb
   - Mobile: Check notification settings

4. **Refresh the Page**
   - Close and reopen the app
   - Permission request should appear again

### Notifications Not Clicking Through?

- Make sure app tab is still open
- Check if browser blocked pop-ups
- Try clicking notification again

### Too Many Notifications?

Currently, you'll get 3 notifications per meeting:
- 15 minutes before
- 5 minutes before
- When starting

This ensures you don't miss any meetings!

## Technical Details

### How It Works Behind the Scenes

1. **Initialization**: Starts when app loads
2. **Permission Check**: Requests notification access
3. **Minute Timer**: Checks every 60 seconds
4. **Time Calculation**: Compares current time with meeting times
5. **Smart Filtering**: Only notifies for today's meetings
6. **Duplicate Prevention**: Tracks what's been notified
7. **Cleanup**: Stops when app closes

### Browser Support

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari (macOS/iOS)
✅ Mobile Browsers (with app open)

⚠️ Note: Browser must be open for notifications (web limitation)

## Best Practices

### For Best Results

1. **Keep App Open**: Browser notifications only work when app tab is open
2. **Allow Permissions**: Accept notification request for full functionality
3. **Pin Tab**: Pin the app tab so it stays open
4. **Test First**: Schedule a test meeting 15 minutes from now to verify

### Mobile Tips

- Add app to home screen for easier access
- Keep app tab open in background
- Check mobile browser notification settings
- Some mobile browsers require app in foreground

## Future Enhancements

Potential features for future updates:
- Custom reminder times (30min, 1hour, etc.)
- Email/SMS reminders (requires backend)
- Notification sound customization
- Snooze reminder option
- Reminder preference per meeting

## Feedback

If notifications aren't working as expected or you have suggestions, please report issues on GitHub!

---

**Last Updated**: 2026-02-03
**Feature Status**: ✅ Live and Active
**Supported Browsers**: Chrome, Firefox, Safari, Edge
