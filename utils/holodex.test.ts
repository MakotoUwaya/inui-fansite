import { describe, it, expect } from 'vitest';
import { formatSubscriberCount, formatSuborg, getChannelGroup } from './holodex';

describe('holodex utils', () => {
  describe('formatSubscriberCount', () => {
    it('formats numbers above 10,000 into 万人', () => {
      expect(formatSubscriberCount(1030000)).toBe('103万人');
      expect(formatSubscriberCount(754200)).toBe('75.4万人');
      expect(formatSubscriberCount(359000)).toBe('35.9万人');
      expect(formatSubscriberCount(12345)).toBe('1.2万人');
      expect(formatSubscriberCount('1030000')).toBe('103万人');
    });

    it('formats numbers under 10,000 with separators', () => {
      expect(formatSubscriberCount(8500)).toBe('8,500人');
      expect(formatSubscriberCount(999)).toBe('999人');
    });

    it('handles falsy or invalid values gracefully', () => {
      expect(formatSubscriberCount(undefined)).toBe('');
      expect(formatSubscriberCount(null)).toBe('');
      expect(formatSubscriberCount('')).toBe('');
      expect(formatSubscriberCount(0)).toBe('');
      expect(formatSubscriberCount('invalid')).toBe('');
    });
  });

  describe('formatSuborg', () => {
    it('cuts the first 2 characters from suborg', () => {
      expect(formatSuborg('0iSanbaka')).toBe('Sanbaka');
      expect(formatSuborg('101SEEDs1期')).toBe('1SEEDs1期');
      expect(formatSuborg('0301期生')).toBe('01期生');
    });

    it('returns empty string or original when too short or missing', () => {
      expect(formatSuborg(undefined)).toBe('');
      expect(formatSuborg(null)).toBe('');
      expect(formatSuborg('')).toBe('');
      expect(formatSuborg('JP')).toBe('JP');
    });
  });

  describe('getChannelGroup', () => {
    it('prioritizes group property when present', () => {
      expect(
        getChannelGroup({
          id: '1',
          name: '戌亥とこ',
          group: 'Sanbaka',
          suborg: '0iSanbaka',
        }),
      ).toBe('Sanbaka');
    });

    it('falls back to formatted suborg when group is missing or empty', () => {
      expect(
        getChannelGroup({
          id: '2',
          name: 'ライバー',
          group: null,
          suborg: '101SEEDs1期',
        }),
      ).toBe('1SEEDs1期');
    });

    it('ignores ZZ for group and suborg', () => {
      expect(
        getChannelGroup({
          id: '4',
          name: '富士葵',
          group: 'ZZ',
          suborg: 'ZZ',
        }),
      ).toBe('');
      expect(
        getChannelGroup({
          id: '5',
          name: '個人勢',
          group: '',
          suborg: '0iZZ',
        }),
      ).toBe('');
    });

    it('returns empty string when both are missing or null', () => {
      expect(getChannelGroup(null)).toBe('');
      expect(getChannelGroup({ id: '3', name: 'ライバー' })).toBe('');
    });
  });
});
