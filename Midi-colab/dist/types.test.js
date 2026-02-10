import { describe, it, expect } from 'vitest';
describe('Types', () => {
    it('MidiEvent is defined', () => {
        const event = {
            type: 'noteon',
            data: [60, 100],
            timestamp: Date.now(),
            source: 'keyboard'
        };
        expect(event.type).toBe('noteon');
    });
    it('User is defined', () => {
        const user = {
            id: '1',
            name: 'Test User',
            color: '#ff0000',
            status: 'online'
        };
        expect(user.status).toBe('online');
    });
});
//# sourceMappingURL=types.test.js.map