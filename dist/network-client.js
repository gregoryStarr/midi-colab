import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { storage, isIndexedDBAvailable } from './storage';
export class NetworkClient {
    constructor(wsUrl, engine) {
        this.wsUrl = wsUrl;
        this.engine = engine;
        this.provider = null;
        this.ydoc = new Y.Doc();
        this.logs = this.ydoc.getArray('logs');
        this.messages = this.ydoc.getArray('messages');
        this.fileMetadata = this.ydoc.getMap('files');
        this.isOnline = false;
    }
    async connect() {
        if (this.provider)
            return;
        this.provider = new WebsocketProvider(this.wsUrl, 'midi-collab-room', this.ydoc);
        this.provider.on('status', async (event) => {
            console.log('Yjs connection status:', event.status);
            this.isOnline = event.status === 'connected';
            // Process offline queue when coming online
            if (this.isOnline && isIndexedDBAvailable()) {
                await this.processOfflineQueue();
            }
        });
    }
    disconnect() {
        this.isOnline = false;
        this.provider?.destroy();
        this.provider = null;
    }
    getProvider() {
        return this.provider;
    }
    onMidiEvent(callback) {
        if (!this.provider)
            return () => { };
        const awareness = this.provider.awareness;
        const handler = (changes) => {
            const states = awareness.getStates();
            states.forEach((state, clientId) => {
                if (state && state.currentMidi && clientId !== awareness.clientID) {
                    callback(state.currentMidi, clientId);
                }
            });
        };
        awareness.on('change', handler);
        return () => awareness.off('change', handler);
    }
    setLocalUser(user) {
        if (this.provider) {
            this.provider.awareness.setLocalState(user);
        }
    }
    getOnlineUsers() {
        if (!this.provider)
            return [];
        return Array.from(this.provider.awareness.getStates().values()).filter((state) => state && typeof state === 'object' && 'id' in state);
    }
    onPresenceChange(cb) {
        if (!this.provider)
            return;
        const update = () => cb(this.getOnlineUsers());
        this.provider.awareness.on('change', update);
        update(); // Initial
        return () => this.provider.awareness.off('change', update);
    }
    broadcastRaw(input) {
        if (this.provider) {
            // Use Yjs map for reliable cross-tab broadcasting
            const broadcastMap = this.ydoc.getMap('broadcast');
            // Use client ID + timestamp for unique keys to avoid collisions
            const clientId = this.provider.awareness.clientID || 'unknown';
            const key = `${clientId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('NetworkClient: broadcasting MIDI via map with key:', key, 'data:', input);
            broadcastMap.set(key, input);
        }
        else {
            console.log('NetworkClient: no provider, cannot broadcast');
        }
    }
    async broadcastProcessed(input) {
        if (!this.engine)
            throw new Error('Engine required for processing');
        const output = await this.engine.process(input);
        this.broadcastRaw(output);
        return output;
    }
    getLogs() {
        return this.ydoc.getMap('broadcast');
    }
    pipeToContainer(input) {
        if (this.engine) {
            return this.engine.process(input);
        }
        return Promise.resolve({});
    }
    sendMessage(message) {
        const user = this.provider?.awareness.getLocalState();
        if (user) {
            const chatMessage = {
                id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: user.id,
                userName: user.name,
                content: message,
                timestamp: Date.now(),
                type: 'message'
            };
            this.messages.push([chatMessage]);
        }
    }
    onMessage(cb) {
        const update = () => cb(this.messages.toArray());
        this.messages.observe(update);
        update(); // Initial call
        return () => this.messages.unobserve(update);
    }
    shareFile(metadata) {
        this.fileMetadata.set(metadata.id, metadata);
    }
    onFileShared(cb) {
        const update = () => cb(new Map(Array.from(this.fileMetadata.entries())));
        this.fileMetadata.observe(update);
        update(); // Initial call
        return () => this.fileMetadata.unobserve(update);
    }
    // Offline-first methods
    async processOfflineQueue() {
        if (!isIndexedDBAvailable())
            return;
        try {
            const operations = await storage.getOfflineOperations();
            for (const op of operations) {
                try {
                    switch (op.type) {
                        case 'create':
                            await this.syncCreateOperation(op);
                            break;
                        case 'update':
                            await this.syncUpdateOperation(op);
                            break;
                        case 'delete':
                            await this.syncDeleteOperation(op);
                            break;
                    }
                    // Remove from queue after successful sync
                    await storage.removeOfflineOperation(op.id);
                }
                catch (error) {
                    console.error('Failed to sync offline operation:', op, error);
                    // Keep operation in queue for retry
                }
            }
        }
        catch (error) {
            console.error('Failed to process offline queue:', error);
        }
    }
    async syncCreateOperation(op) {
        switch (op.store) {
            case 'midi_logs':
                this.logs.push([op.data]);
                break;
            case 'chat_history':
                this.messages.push([op.data]);
                break;
            case 'shared_files':
                this.fileMetadata.set(op.data.id, op.data);
                break;
        }
    }
    async syncUpdateOperation(op) {
        switch (op.store) {
            case 'midi_logs':
                // Find and update in logs array
                const logsArray = this.logs.toArray();
                const logIndex = logsArray.findIndex((log) => log.id === op.data.id);
                if (logIndex >= 0) {
                    this.logs.delete(logIndex, 1);
                    this.logs.insert(logIndex, [op.data]);
                }
                break;
            case 'chat_history':
                // Find and update in messages array
                const messagesArray = this.messages.toArray();
                const messageIndex = messagesArray.findIndex((msg) => msg.id === op.data.id);
                if (messageIndex >= 0) {
                    this.messages.delete(messageIndex, 1);
                    this.messages.insert(messageIndex, [op.data]);
                }
                break;
            case 'shared_files':
                this.fileMetadata.set(op.data.id, op.data);
                break;
        }
    }
    async syncDeleteOperation(op) {
        switch (op.store) {
            case 'midi_logs':
                const logsArray = this.logs.toArray();
                const logIndex = logsArray.findIndex((log) => log.id === op.data.id);
                if (logIndex >= 0) {
                    this.logs.delete(logIndex, 1);
                }
                break;
            case 'chat_history':
                const messagesArray = this.messages.toArray();
                const messageIndex = messagesArray.findIndex((msg) => msg.id === op.data.id);
                if (messageIndex >= 0) {
                    this.messages.delete(messageIndex, 1);
                }
                break;
            case 'shared_files':
                this.fileMetadata.delete(op.data.id);
                break;
        }
    }
    // Queue operations when offline
    async queueOfflineOperation(type, store, data) {
        if (!isIndexedDBAvailable())
            return;
        const operation = {
            id: `${type}_${store}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            store,
            data,
            timestamp: Date.now()
        };
        await storage.queueOfflineOperation(operation);
    }
    // Enhanced methods that work offline-first
    async sendMessageOfflineFirst(message) {
        const user = this.provider?.awareness.getLocalState();
        if (!user)
            return;
        const chatMessage = {
            id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name,
            content: message,
            timestamp: Date.now(),
            type: 'message'
        };
        if (this.isOnline) {
            this.messages.push([chatMessage]);
        }
        else {
            // Store locally when offline
            if (isIndexedDBAvailable()) {
                await storage.createChatMessage(chatMessage);
            }
            // Queue for sync when online
            await this.queueOfflineOperation('create', 'chat_history', chatMessage);
        }
    }
    async logMidiEventOfflineFirst(event) {
        if (this.isOnline) {
            this.logs.push([event]);
        }
        else {
            // Store locally when offline
            if (isIndexedDBAvailable()) {
                await storage.createMidiLog(event);
            }
            // Queue for sync when online
            await this.queueOfflineOperation('create', 'midi_logs', event);
        }
    }
    async shareFileOfflineFirst(metadata) {
        if (this.isOnline) {
            this.fileMetadata.set(metadata.id, metadata);
        }
        else {
            // Store locally when offline
            if (isIndexedDBAvailable()) {
                await storage.createSharedFile(metadata);
            }
            // Queue for sync when online
            await this.queueOfflineOperation('create', 'shared_files', metadata);
        }
    }
}
//# sourceMappingURL=network-client.js.map