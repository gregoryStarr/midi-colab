import type { User, PresenceUpdateCallback } from './types';

/**
 * Manages user presence and awareness state.
 * 
 * The PresenceManager abstracts the Yjs awareness protocol to provide
 * a simple interface for tracking online users and their states (e.g., active, idle).
 */
export class PresenceManager {
  private provider: any | null = null;

  constructor(networkClient: any) {
    this.provider = networkClient.getProvider();
  }

  /**
   * Sets the local user's presence state.
   * 
   * @param user The user object representing the local user.
   */
  setLocalState(user: User) {
    if (this.provider) {
      this.provider.awareness.setLocalState(user);
    }
  }

  /**
   * Retrieves a list of currently online users.
   * Filters the raw awareness states to ensure they match the User interface.
   * 
   * @returns An array of User objects.
   */
  getOnlineUsers(): User[] {
    if (!this.provider) return [];
    return Array.from(this.provider.awareness.getStates().values()).filter((state: any): state is User =>
      state && typeof state === 'object' && state !== null && 'id' in state && 'name' in state
    );
  }

  /**
   * Subscribes to presence updates.
   * 
   * @param cb Callback function to execute when the list of online users changes.
   * @returns A cleanup function to unsubscribe.
   */
  onUpdate(cb: PresenceUpdateCallback) {
    if (!this.provider) return () => {};
    const update = () => cb(this.getOnlineUsers());
    this.provider.awareness.on('change', update);
    update(); // Initial call
    return () => this.provider.awareness.off('change', update);
  }

  /**
   * Exports the current presence state for external processing (e.g., in a container).
   * 
   * @returns An object containing the list of users and a timestamp.
   */
  // Export for container processing
  exportToContainer(): any {
    return { users: this.getOnlineUsers(), timestamp: Date.now() };
  }
}