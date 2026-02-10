import { describe, it, expect } from 'vitest';
import type { MidiEvent, User } from './types';

describe('Types', () => {
  it('MidiEvent is defined', () => {
    const event: MidiEvent = {
      type: 'noteon',
      data: [60, 100],
      timestamp: Date.now(),
      source: 'keyboard'
    };
    expect(event.type).toBe('noteon');
  });

  it('User is defined', () => {
    const user: User = {
      id: '1',
      name: 'Test User',
      color: '#ff0000',
      status: 'online'
    };
    expect(user.status).toBe('online');
  });
});