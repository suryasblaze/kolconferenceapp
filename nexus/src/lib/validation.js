/**
 * Input Validation & Sanitization Utilities
 * Prevents XSS, injection attacks, and ensures data integrity
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Limit length to prevent DoS
    .substring(0, 10000);
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} input - The input string
 * @returns {string} - HTML-safe string
 */
export const escapeHtml = (input) => {
  if (typeof input !== 'string') return '';

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, char => htmlEntities[char]);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate phone number (basic international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return true; // Optional field
  // Allow digits, spaces, dashes, plus, parentheses
  const phoneRegex = /^[\d\s\-+()]{6,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} - Whether time is valid
 */
export const isValidTime = (time) => {
  if (!time || typeof time !== 'string') return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} - Whether date is valid
 */
export const isValidDate = (date) => {
  if (!date || typeof date !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

/**
 * Validate rate/price value
 * @param {string} rate - Rate value to validate
 * @returns {boolean} - Whether rate is valid
 */
export const isValidRate = (rate) => {
  if (!rate || typeof rate !== 'string') return true; // Optional field
  // Allow numbers with optional decimal
  const rateRegex = /^\d+(\.\d{1,6})?$/;
  return rateRegex.test(rate);
};

/**
 * Validate company data before saving
 * @param {object} company - Company object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateCompany = (company) => {
  const errors = [];

  if (!company.name || company.name.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (company.name && company.name.length > 200) {
    errors.push('Company name must be less than 200 characters');
  }

  if (company.email && !isValidEmail(company.email)) {
    errors.push('Invalid email format');
  }

  if (company.phone && !isValidPhone(company.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate meeting data before saving
 * @param {object} meeting - Meeting object to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateMeeting = (meeting) => {
  const errors = [];

  if (!meeting.companyName || meeting.companyName.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (!meeting.date || !isValidDate(meeting.date)) {
    errors.push('Valid date is required');
  }

  if (!meeting.startTime || !isValidTime(meeting.startTime)) {
    errors.push('Valid start time is required');
  }

  if (meeting.endTime && !isValidTime(meeting.endTime)) {
    errors.push('Invalid end time format');
  }

  if (meeting.email && !isValidEmail(meeting.email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate rate row data
 * @param {object} rate - Rate object to validate
 * @param {string} serviceType - 'SMS' or 'VOICE'
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateRate = (rate, serviceType) => {
  const errors = [];

  if (rate.rate && !isValidRate(rate.rate)) {
    errors.push('Invalid rate format');
  }

  // Check for required fields based on service type
  if (serviceType === 'SMS') {
    if (rate.designation && rate.designation.length > 100) {
      errors.push('Designation must be less than 100 characters');
    }
  } else if (serviceType === 'VOICE') {
    if (rate.destination && rate.destination.length > 100) {
      errors.push('Destination must be less than 100 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize an object's string properties
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export default {
  sanitizeString,
  escapeHtml,
  isValidEmail,
  isValidPhone,
  isValidTime,
  isValidDate,
  isValidRate,
  validateCompany,
  validateMeeting,
  validateRate,
  sanitizeObject,
};
