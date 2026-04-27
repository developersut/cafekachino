/**
 * Utility for exporting JSON data to CSV
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Desired file name without extension
 */
export const exportToCSV = (data, fileName) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        
        // Handle nested objects or arrays (like items in a sale)
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value).replace(/,/g, ';'); // Replace commas to avoid CSV break
        }
        
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + (value || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
