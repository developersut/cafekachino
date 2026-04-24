/**
 * Converts JSON data to CSV string and triggers a browser download.
 * @param {Array} data - Array of objects to export.
 * @param {string} fileName - Name of the file to save.
 */
export const exportToCSV = (data, fileName) => {
  if (!data || !data.length) {
    console.error("No data available for export");
    return;
  }

  // Extract headers - for robustness we scan all items to find all possible keys
  const headers = [...new Set(data.flatMap(obj => Object.keys(obj)))];
  
  // Build CSV rows
  const csvRows = [
    headers.join(','), // CSV values header
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        
        // Handle nested arrays (like items in a sale) - we denormalize for CSV
        if (Array.isArray(value)) {
          // If it's a list of items, we just serialize them to a string
          value = `"${value.map(v => `${v.name || v} (x${v.quantity || 1})`).join('; ')}"`;
        }
        
        // Handle Date objects
        if (value instanceof Date) {
          value = value.toISOString();
        }

        // Escape quotes and commas in strings
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value === null || value === undefined ? '' : value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a comprehensive Fiscal Audit report.
 * Denormalizes sales items into individual rows for deep auditing.
 */
export const exportFiscalReport = (sales, expenses, periodLabel = "All_Time") => {
  // 1. Prepare Denormalized Sales Data (One row per item in an order)
  const denormalizedSales = [];
  sales.forEach(sale => {
    sale.items.forEach(item => {
      denormalizedSales.push({
        Type: "SALE",
        OrderID: sale.id,
        Date: sale.timestamp,
        Staff: sale.processedBy,
        Status: sale.status,
        ItemName: item.name,
        Category: item.category,
        UnitPrice: item.price,
        Quantity: item.quantity,
        ItemTotal: (item.price * item.quantity).toFixed(2),
        OrderTax: sale.tax?.toFixed(2) || "0.00",
        OrderTotal: sale.total.toFixed(2)
      });
    });
  });

  // 2. Prepare Expenses Data
  const formattedExpenses = expenses.map(e => ({
    Type: "EXPENSE",
    OrderID: e.id,
    Date: e.timestamp,
    Staff: "Admin",
    Status: "Paid",
    ItemName: e.description,
    Category: e.category,
    UnitPrice: e.amount.toFixed(2),
    Quantity: 1,
    ItemTotal: e.amount.toFixed(2),
    OrderTax: "0.00",
    OrderTotal: e.amount.toFixed(2)
  }));

  // 3. Combine and Export
  const combinedData = [...denormalizedSales, ...formattedExpenses];
  exportToCSV(combinedData, `Kachino_Fiscal_Audit_${periodLabel}`);
};
