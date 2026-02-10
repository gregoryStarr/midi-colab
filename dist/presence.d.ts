import type { User, PresenceUpdateCallback } from './types';
export declare class PresenceManager {
    private provider;
    constructor(networkClient: any);
    setLocalState(user: User): void;
    getOnlineUsers(): User[];
    onUpdate(cb: PresenceUpdateCallback): () => void;
    exportToContainer(): any;
}
//# sourceMappingURL=presence.d.ts.map