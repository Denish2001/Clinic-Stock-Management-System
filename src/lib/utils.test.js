import { describe, it, expect, vi } from 'vitest';
import { debounce } from './utils';

describe('debounce', () => {
  it('should call the function after delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
