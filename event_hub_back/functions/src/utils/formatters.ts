export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPrice(prix: number, devise: string = 'USD'): string {
  if (prix === 0) return 'Free';
  return formatCurrency(prix, devise);
}

export function formatCapacity(available: number, total: number): string {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
  return `${available.toLocaleString()} / ${total.toLocaleString()} (${percentage}%)`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.slice(0, 2) + '***';
  return `${maskedName}@${domain}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

export function formatQuantity(quantity: number, itemName: string): string {
  return `${quantity} ${pluralize(quantity, itemName)}`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}
