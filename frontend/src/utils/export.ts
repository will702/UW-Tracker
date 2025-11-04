import type { UWRecord } from '../types';

export function exportToJSON(data: UWRecord[], filename: string = 'uw-records.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: UWRecord[]) {
  // Convert data to CSV format (simpler than full Excel, but widely compatible)
  const headers = [
    'Code',
    'Company Name',
    'Underwriters',
    'UW Count',
    'IPO Price',
    'Return D+1',
    'Return D+2',
    'Return D+3',
    'Return D+4',
    'Return D+5',
    'Return D+6',
    'Return D+7',
    'Listing Board',
    'Listing Date',
  ];

  const rows = data.map(record => {
    const uwList = record.underwriters && record.underwriters.length > 0
      ? record.underwriters
      : record.uw ? [record.uw] : [];
    
    return [
      record.code || '',
      record.companyName || '',
      uwList.join('; '),
      uwList.length.toString(),
      record.ipoPrice?.toString() || '',
      record.returnD1 !== null && record.returnD1 !== undefined ? (record.returnD1 * 100).toFixed(2) + '%' : '',
      record.returnD2 !== null && record.returnD2 !== undefined ? (record.returnD2 * 100).toFixed(2) + '%' : '',
      record.returnD3 !== null && record.returnD3 !== undefined ? (record.returnD3 * 100).toFixed(2) + '%' : '',
      record.returnD4 !== null && record.returnD4 !== undefined ? (record.returnD4 * 100).toFixed(2) + '%' : '',
      record.returnD5 !== null && record.returnD5 !== undefined ? (record.returnD5 * 100).toFixed(2) + '%' : '',
      record.returnD6 !== null && record.returnD6 !== undefined ? (record.returnD6 * 100).toFixed(2) + '%' : '',
      record.returnD7 !== null && record.returnD7 !== undefined ? (record.returnD7 * 100).toFixed(2) + '%' : '',
      record.listingBoard || '',
      (() => {
        const listingDate = record.listingDate;
        // Handle null, undefined, or empty string
        if (!listingDate || listingDate === '' || listingDate === 'null' || listingDate === 'undefined') {
          return '';
        }
        try {
          const date = new Date(listingDate);
          // Check if date is valid (not NaN)
          if (isNaN(date.getTime())) {
            // If invalid date, try to return formatted string if it's already a date string
            if (typeof listingDate === 'string' && listingDate.includes('-')) {
              return listingDate.split('T')[0]; // Return just the date part if ISO format
            }
            return ''; // Return empty if completely invalid
          }
          // Format as MM/DD/YYYY for CSV compatibility
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        } catch (e) {
          // If date parsing fails, try to extract date from string
          if (typeof listingDate === 'string') {
            // If it's an ISO date string, extract just the date part
            const dateMatch = listingDate.match(/^(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              return dateMatch[1];
            }
          }
          return ''; // Return empty if all parsing fails
        }
      })(),
    ];
  });

  // Escape CSV values (handle commas and quotes)
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'uw-records.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

