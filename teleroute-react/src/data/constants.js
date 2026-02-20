// Regions
export const regions = [
  { id: 'APAC', label: 'Asia Pacific' },
  { id: 'EUR', label: 'Europe' },
  { id: 'AFR', label: 'Africa' },
  { id: 'MENA', label: 'MENA' },
  { id: 'EURASIA', label: 'EURASIA' },
  { id: 'LATAM', label: 'LatAm' },
];

// Countries by Region
export const REGION_COUNTRIES = {
  'APAC': [
    'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Islands',
    'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'Palau', 'Tuvalu', 'Cook Islands',
    'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Afghanistan',
    'China', 'Japan', 'South Korea', 'North Korea', 'Taiwan', 'Hong Kong', 'Macau', 'Mongolia',
    'Thailand', 'Vietnam', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Myanmar', 'Cambodia',
    'Laos', 'Brunei', 'Timor-Leste'
  ],
  'EUR': [
    'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium',
    'Austria', 'Switzerland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Iceland', 'Luxembourg', 'Malta', 'Cyprus',
    'Estonia', 'Latvia', 'Lithuania', 'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Bosnia',
    'Montenegro', 'North Macedonia', 'Albania', 'Kosovo', 'Moldova', 'Ukraine', 'Belarus', 'Russia'
  ],
  'ME': [
    'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Yemen',
    'Iraq', 'Iran', 'Israel', 'Palestine', 'Jordan', 'Lebanon', 'Syria', 'Turkey',
    'Armenia', 'Azerbaijan', 'Georgia', 'Cyprus'
  ],
  'AFR': [
    'South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ghana', 'Morocco', 'Algeria', 'Tunisia',
    'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Senegal', 'Ivory Coast', 'Cameroon', 'Angola',
    'Mozambique', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mauritius', 'Madagascar',
    'Democratic Republic of Congo', 'Sudan', 'Libya', 'Mali', 'Niger', 'Burkina Faso', 'Benin',
    'Togo', 'Sierra Leone', 'Liberia', 'Guinea', 'Gambia', 'Cape Verde', 'Mauritania', 'Malawi'
  ],
  'LATAM': [
    'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador',
    'Bolivia', 'Paraguay', 'Uruguay', 'Panama', 'Costa Rica', 'Guatemala', 'Honduras',
    'El Salvador', 'Nicaragua', 'Cuba', 'Dominican Republic', 'Puerto Rico', 'Jamaica',
    'Trinidad and Tobago', 'Haiti', 'Bahamas', 'Barbados', 'Guyana', 'Suriname', 'Belize'
  ],
  'NA': [
    'United States', 'Canada', 'USA - AT&T', 'USA - Verizon', 'USA - T-Mobile', 'USA - Sprint',
    'Canada - Rogers', 'Canada - Bell', 'Canada - Telus'
  ],
  'MENA': [
    'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
    'Israel', 'Jordan', 'Lebanon', 'Iraq', 'Iran', 'Yemen', 'Syria', 'Palestine',
    'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan'
  ],
  'EURASIA': [
    'Russia', 'Ukraine', 'Belarus', 'Moldova',
    'Armenia', 'Azerbaijan', 'Georgia',
    'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'
  ]
};

// Get all countries from all regions
export const ALL_COUNTRIES = [...new Set(Object.values(REGION_COUNTRIES).flat())].sort();

// SMS Columns
export const SMS_COLUMNS = ['designation', 'product', 'network', 'rate', 'traffic', 'display', 'tps', 'cap', 'hop'];
export const SMS_HEADERS = ['Designation', 'Product', 'Network', 'Rate', 'Traffic', 'Display', 'TPS', 'CAP', 'HOP'];

// Voice Columns
export const VOICE_COLUMNS = ['destination', 'product', 'breakout', 'rate', 'billingIncrement', 'display', 'acd', 'asr', 'hop'];
export const VOICE_HEADERS = ['Destination', 'Product', 'Breakout', 'Rate', 'Billing Increment', 'Display', 'ACD', 'ASR', 'HOP'];

// Default dropdown options
export const DEFAULT_PRODUCT_OPTIONS = ['PRIME', 'Direct', 'HQ', 'Premium', 'Wholesale', 'SS7', 'SIM'];
export const DEFAULT_NETWORK_OPTIONS = ['Local Bypass', 'Local to Local', 'Local Direct', 'All Network'];
export const DEFAULT_TRAFFIC_OPTIONS = ['OTP', 'Casino', 'Spam', 'All', 'Marketing'];

// Service Types
export const SERVICE_TYPES = ['SMS', 'VOICE'];

// List Types
export const LIST_TYPES = ['TARGET', 'PUSH'];

// Tabs
export const TABS = [
  { id: 'rates', label: 'Rates', icon: 'ChartLineUp' },
  { id: 'companies', label: 'Companies', icon: 'Buildings' },
  { id: 'clientoffers', label: 'Client Offers', icon: 'DownloadSimple' },
  { id: 'ouroffers', label: 'Our Offers', icon: 'UploadSimple' },
  { id: 'meetings', label: 'Meetings', icon: 'Calendar' },
];
