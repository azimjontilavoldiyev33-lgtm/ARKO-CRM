import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/telegram';

describe('escapeHtml', () => {
  it('HTML maxsus belgilarini xavfsizlantiradi', () => {
    expect(escapeHtml('<b>Ali</b>')).toBe('&lt;b&gt;Ali&lt;/b&gt;');
  });

  it('& belgisini birinchi almashtiradi (ikki marta escape bo\'lmaydi)', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('oddiy matnni o\'zgartirmaydi', () => {
    expect(escapeHtml('Ali Valiyev')).toBe('Ali Valiyev');
  });
});
