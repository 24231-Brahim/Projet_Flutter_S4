import {
  formatDate,
  formatDateTime,
  formatShortDate,
  formatTime,
  formatDateRange,
  getTimeUntil,
  isWithinHours,
  isToday,
  addHours,
  addDays,
} from '../date';

describe('date utils', () => {
  const testDate = new Date('2025-06-15T14:30:00');

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate(testDate);
      expect(result).toContain('2025');
      expect(result).toContain('June');
      expect(result).toContain('15');
    });

    it('should handle Firestore Timestamp', () => {
      const mockTimestamp = {
        toDate: () => testDate,
      };
      const result = formatDate(mockTimestamp as any);
      expect(result).toContain('2025');
    });
  });

  describe('formatDateTime', () => {
    it('should include time in format', () => {
      const result = formatDateTime(testDate);
      expect(result).toContain('2025');
      expect(result).toContain('June');
      expect(result).toContain('2:30');
    });
  });

  describe('formatShortDate', () => {
    it('should format short date', () => {
      const result = formatShortDate(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });
  });

  describe('formatTime', () => {
    it('should format time only', () => {
      const result = formatTime(testDate);
      expect(result).toContain('2:30');
    });
  });

  describe('formatDateRange', () => {
    it('should format date range', () => {
      const start = new Date('2025-06-15T14:00:00');
      const end = new Date('2025-06-15T18:00:00');
      const result = formatDateRange(start, end);
      expect(result).toContain('June');
      expect(result).toContain('18:00');
    });
  });

  describe('getTimeUntil', () => {
    it('should return future time details for future date', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 48);
      const result = getTimeUntil(futureDate);
      
      expect(result.isPast).toBe(false);
      expect(result.days).toBeGreaterThanOrEqual(1);
    });

    it('should return past time details for past date', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60);
      const result = getTimeUntil(pastDate);
      
      expect(result.isPast).toBe(true);
    });

    it('should calculate hours correctly', () => {
      const twoHoursFromNow = new Date(Date.now() + 1000 * 60 * 60 * 2);
      const result = getTimeUntil(twoHoursFromNow);
      
      expect(result.hours).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isWithinHours', () => {
    it('should return true for date within hours', () => {
      const inOneHour = addHours(new Date(), 1);
      expect(isWithinHours(inOneHour, 2)).toBe(true);
    });

    it('should return false for date beyond hours', () => {
      const tomorrow = addHours(new Date(), 25);
      expect(isWithinHours(tomorrow, 24)).toBe(false);
    });

    it('should return false for past dates', () => {
      const yesterday = new Date(Date.now() - 1000 * 60 * 60);
      expect(isWithinHours(yesterday, 24)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('addHours', () => {
    it('should add hours correctly', () => {
      const result = addHours(testDate, 2);
      expect(result.getTime()).toBe(testDate.getTime() + 2 * 60 * 60 * 1000);
    });

    it('should handle negative hours', () => {
      const result = addHours(testDate, -2);
      expect(result.getTime()).toBe(testDate.getTime() - 2 * 60 * 60 * 1000);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const result = addDays(testDate, 1);
      expect(result.getDate()).toBe(testDate.getDate() + 1);
    });

    it('should handle month boundary', () => {
      const endOfMonth = new Date('2025-01-31T12:00:00');
      const result = addDays(endOfMonth, 1);
      expect(result.getMonth()).toBe(1);
    });

    it('should handle negative days', () => {
      const result = addDays(testDate, -1);
      expect(result.getDate()).toBe(testDate.getDate() - 1);
    });
  });
});
