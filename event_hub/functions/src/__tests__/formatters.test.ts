import {
  formatCurrency,
  formatPrice,
  formatCapacity,
  truncateText,
  slugify,
  capitalize,
  capitalizeWords,
  maskEmail,
  pluralize,
  formatQuantity,
  formatRating,
  formatPercentage,
  formatDistance,
  formatDuration,
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toContain('100');
      expect(formatCurrency(100, 'GBP')).toContain('100');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toContain('1,000');
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency', () => {
      expect(formatPrice(50)).toBe('$50.00');
    });

    it('should return "Free" for zero price', () => {
      expect(formatPrice(0)).toBe('Free');
    });

    it('should accept custom currency', () => {
      expect(formatPrice(50, 'EUR')).toContain('50');
    });
  });

  describe('formatCapacity', () => {
    it('should format capacity with percentage', () => {
      expect(formatCapacity(50, 100)).toContain('50');
      expect(formatCapacity(50, 100)).toContain('100');
      expect(formatCapacity(50, 100)).toContain('50%');
    });

    it('should handle zero total', () => {
      expect(formatCapacity(0, 0)).toContain('0%');
    });

    it('should handle full capacity', () => {
      expect(formatCapacity(0, 100)).toContain('0%');
    });
  });

  describe('truncateText', () => {
    it('should return original text if within limit', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate text exceeding limit', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
    });

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('HELLO')).toBe('hello');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('hello@world!')).toBe('helloworld');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('should trim whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should lowercase the rest', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('should handle multiple spaces', () => {
      expect(capitalizeWords('hello  world')).toBe('Hello  World');
    });
  });

  describe('maskEmail', () => {
    it('should mask email name', () => {
      expect(maskEmail('john@example.com')).toContain('***');
      expect(maskEmail('john@example.com')).toContain('@example.com');
    });

    it('should show first two characters', () => {
      expect(maskEmail('john@example.com')).toContain('jo***');
    });

    it('should handle short names', () => {
      expect(maskEmail('a@example.com')).toContain('***');
    });
  });

  describe('pluralize', () => {
    it('should use singular for count of 1', () => {
      expect(pluralize(1, 'ticket')).toBe('1 ticket');
    });

    it('should use plural for count > 1', () => {
      expect(pluralize(2, 'ticket')).toBe('2 tickets');
    });

    it('should use custom plural', () => {
      expect(pluralize(2, 'person', 'people')).toBe('2 people');
    });
  });

  describe('formatQuantity', () => {
    it('should format quantity with item name', () => {
      expect(formatQuantity(2, 'ticket')).toBe('2 tickets');
    });

    it('should use singular for count of 1', () => {
      expect(formatQuantity(1, 'ticket')).toBe('1 ticket');
    });
  });

  describe('formatRating', () => {
    it('should format rating to 1 decimal', () => {
      expect(formatRating(4.567)).toBe('4.6');
      expect(formatRating(5)).toBe('5.0');
      expect(formatRating(3.1)).toBe('3.1');
    });
  });

  describe('formatPercentage', () => {
    it('should calculate percentage', () => {
      expect(formatPercentage(25, 100)).toBe('25%');
      expect(formatPercentage(1, 3)).toBe('33%');
    });

    it('should return 0% for zero total', () => {
      expect(formatPercentage(5, 0)).toBe('0%');
    });
  });

  describe('formatDistance', () => {
    it('should format meters for distances < 1km', () => {
      expect(formatDistance(0.5)).toContain('m');
    });

    it('should format km for distances >= 1km', () => {
      expect(formatDistance(5)).toContain('km');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30min');
    });

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30min');
    });
  });
});
