import type { User, PresenceUpdateCallback } from './types';

export class PresenceManager {
  private provider: any | null = null;

  constructor() {}

  setLocalState(user: User) {
    if (this.provider) {
      this.provider.awareness.setLocalState(user);
    }
  }

  getOnlineUsers(): User[] {
    if (!this.provider) return [];
    return Array.from(this.provider.awareness.getStates().values()).filter((state: any): state is User =>
      state && typeof state === 'object' && state !== null && 'id' in state && 'name' in state
    );
  }

  onUpdate(cb: PresenceUpdateCallback) {
    if (!this.provider) return () => {};
    const update = () => cb(this.getOnlineUsers());
    this.provider.awareness.on('change', update);
    update(); // Initial call
    return () => this.provider.awareness.off('change', update);
  }

  // Export for container processing
  exportToContainer(): any {
    return { users: this.getOnlineUsers(), timestamp: Date.now() };
  }
}