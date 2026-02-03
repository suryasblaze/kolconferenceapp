# TeleRoute SMS & Voice Management App

A comprehensive web application for managing SMS and Voice rate lists, companies, meetings, and client offers with Supabase cloud storage.

## Features

- **Rate Management**: Manage SMS and Voice rates across multiple regions (APAC, EUR, ME, AFR, MENA, EURASIA, LATAM, NA)
- **Companies**: Track SMS and Voice companies with contact information
- **Meeting Scheduler**: Calendar-based meeting scheduling with smart overlap detection
- **Client Offers**: Manage and track client offers with search and filtering
- **Cloud Storage**: All data stored securely in Supabase
- **File Attachments**: Upload and view meeting attachments
- **Responsive Design**: Optimized for mobile and desktop

## Live Demo

Visit: [https://suryasblaze.github.io/kolconferenceapp/](https://suryasblaze.github.io/kolconferenceapp/)

## Setup

### 1. Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema-FINAL.sql` in the Supabase SQL Editor
3. Update the Supabase credentials in `index.html`:
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

### 2. Database Migration (Optional)

If you have existing localStorage data, run the migration script:
1. Open the app in your browser
2. Open browser console (F12)
3. Copy and paste the contents of `migrate-FINAL.js`
4. Press Enter to migrate data to Supabase

## Project Structure

```
├── index.html                      # Main application file
├── supabase-schema-FINAL.sql       # Database schema
├── migrate-FINAL.js                # Migration script
├── SUPABASE-FIXED-README.md        # Detailed setup guide
└── README.md                       # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Icons**: Phosphor Icons
- **Hosting**: GitHub Pages

## Key Features

### Rate Management
- Support for SMS and Voice services
- Multiple list types (Target, AFR, etc.)
- Region-based organization
- Custom product, network, and traffic options

### Company Management
- Separate SMS and Voice companies
- Contact information tracking
- Meeting schedule tracking

### Meeting Scheduler
- Visual calendar interface
- Date navigation (prev/next/today)
- Smart overlap detection with side-by-side display
- Time-based scheduling (9 AM - 6 PM)
- Meeting details with notes and attachments

### Client Offers
- Track offers by company
- Search and date range filtering
- Complete company contact details
- Offer history tracking

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

The app is built as a single-page application with no build process required. Simply open `index.html` in a browser to run locally.

## License

MIT License

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Support

For issues or questions, please open an issue on GitHub.
