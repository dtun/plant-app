import { describe, it, expect } from 'vitest';

describe('Sanity Tests', () => {
  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2);
    expect(2 + 2).toBe(4);
    expect(10 + 5).toBe(15);
  });

  it('should perform basic arithmetic', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(5, 3)).toBe(8);
    expect(sum(-1, 1)).toBe(0);
    expect(sum(100, 200)).toBe(300);
  });
});
