# Nexus

SMS & Voice conference management app built with React + Vite and Supabase backend.

## Features

- **5 Tab Navigation**: Rates, Companies, Client Offers, Our Offers, Meetings
- **SMS & Voice Management**: Toggle between service types
- **Rate Cards**: Manage offer/wants rates by region
- **Company Management**: Add, delete, and schedule meetings with companies
- **Meeting Calendar**: Visual timetable with meeting blocks
- **Offer Tracking**: Track client offers and your offers with comparison mode
- **Supabase Backend**: Real-time data sync with PostgreSQL
- **Mobile Responsive**: Optimized for mobile devices
- **Excel Import/Export**: Import and export rate data

## Tech Stack

- **React 18** with Hooks
- **Vite** for fast builds
- **Tailwind CSS 4** with custom theme
- **Zustand** for state management
- **Supabase** for backend (PostgreSQL)
- **SheetJS (xlsx)** for Excel handling
- **Phosphor Icons** for UI icons

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

1. The build is configured for `/kolconferenceapp/` base URL
2. Build the project: `npm run build`
3. Deploy the `dist` folder to GitHub Pages

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx        # App header with service/region selection
│   │   └── BottomTabs.jsx    # Bottom navigation
│   ├── tabs/
│   │   ├── RatesTab.jsx      # Rate data table
│   │   ├── CompaniesTab.jsx  # Company management
│   │   ├── MeetingsTab.jsx   # Meeting calendar
│   │   ├── ClientOffersTab.jsx
│   │   └── OurOffersTab.jsx
│   ├── modals/
│   │   ├── ImportModal.jsx   # Excel import
│   │   ├── CalendarModal.jsx # Date picker
│   │   ├── ScheduleModal.jsx # Schedule meeting
│   │   └── MeetingModal.jsx  # Meeting details/edit
│   └── ui/
│       ├── Toast.jsx
│       ├── LoadingOverlay.jsx
│       └── RotateOverlay.jsx
├── data/
│   └── constants.js          # Regions, columns, options
├── lib/
│   └── supabase.js           # Supabase client
├── store/
│   └── useStore.js           # Zustand store
├── App.jsx                   # Main app component
├── main.jsx                  # Entry point
└── index.css                 # Tailwind + custom styles
```

## Supabase Tables

- `rates` - Rate card data
- `companies` - Company directory
- `meetings` - Meeting records
- `custom_options` - User-added dropdown options

## Migrated from

This is a React migration of the original single-file HTML application. All functionality has been preserved with better code organization and maintainability.
