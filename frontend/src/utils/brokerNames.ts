// Broker code to name mapping for Indonesian Stock Exchange
// Reference: https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-broker

export const brokerNames: Record<string, string> = {
  // Common Indonesian broker codes
  'AH': 'Aneka Tambang',
  'BC': 'Bank Central Asia',
  'BI': 'Bank Indonesia',
  'BM': 'Bank Mandiri',
  'BN': 'Bank Negara Indonesia',
  'BR': 'Bank Rakyat Indonesia',
  'CDIA': 'CIMB Niaga Sekuritas',
  'DM': 'Danamon',
  'HP': 'Hutama Karya',
  'LG': 'Lippo Group',
  'MI': 'Mandiri Investasi',
  'MS': 'Mandiri Sekuritas',
  'SC': 'Sari Citra',
  'SM': 'Sinar Mas',
  'SP': 'Sinarmas Sekuritas',
  'SS': 'Sekuritas Sinarmas',
  'WS': 'Wahana Sekuritas',
  'YS': 'Yulie Sekuritas',
  // Add more mappings as needed
};

/**
 * Get broker name from code, or return the code if name not found
 */
export function getBrokerName(code: string): string {
  return brokerNames[code.toUpperCase()] || code;
}

/**
 * Check if search term matches broker code or name
 */
export function matchesBroker(searchTerm: string, code: string): boolean {
  const search = searchTerm.toLowerCase();
  const codeLower = code.toLowerCase();
  const name = getBrokerName(code).toLowerCase();
  
  return codeLower.includes(search) || name.includes(search);
}

