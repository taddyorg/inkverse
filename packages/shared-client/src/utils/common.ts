export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length === 0 || domain.length > 253) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false; // consecutive dots
  
  const labels = domain.split('.');
  if (labels.length < 2) return false; // need at least domain.tld
  
  // Validate each label
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
  }
  
  // TLD should be alphabetic and at least 2 chars
  const tld = labels[labels.length - 1];
  if (!tld) return false;
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;
  
  return true;
}