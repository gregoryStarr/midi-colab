export class PresenceManager {
    constructor(networkClient) {
        this.provider = null;
        this.provider = networkClient.getProvider();
    }
    setLocalState(user) {
        if (this.provider) {
            this.provider.awareness.setLocalState(user);
        }
    }
    getOnlineUsers() {
        if (!this.provider)
            return [];
        return Array.from(this.provider.awareness.getStates().values()).filter((state) => state && typeof state === 'object' && state !== null && 'id' in state && 'name' in state);
    }
    onUpdate(cb) {
        if (!this.provider)
            return () => { };
        const update = () => cb(this.getOnlineUsers());
        this.provider.awareness.on('change', update);
        update(); // Initial call
        return () => this.provider.awareness.off('change', update);
    }
    // Export for container processing
    exportToContainer() {
        return { users: this.getOnlineUsers(), timestamp: Date.now() };
    }
}
//# sourceMappingURL=presence.js.map