import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { User, ContainerInput, ChatMessage, MidiLogEntry, FileMetadata } from './types';
import type { WebContainerEngine } from './web-container-engine';
import { storage, isIndexedDBAvailable } from './storage';

export class NetworkClient {
  private provider: WebsocketProvider | null = null;
  private ydoc = new Y.Doc();
  private logs = this.ydoc.getArray('logs');
  private messages = this.ydoc.getArray('messages');
  private fileMetadata = this.ydoc.getMap('files');
  private isOnline = false;

  constructor(public wsUrl: string, public engine?: WebContainerEngine) {}

  async connect() {
    if (this.provider) return;
    this.provider = new WebsocketProvider(this.wsUrl, 'midi-collab-room', this.ydoc);
    this.provider.on('status', async (event: { status: string }) => {
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

  setLocalUser(user: User) {
    if (this.provider) {
      this.provider.awareness.setLocalState(user);
    }
  }

  getOnlineUsers(): User[] {
    if (!this.provider) return [];
    return Array.from(this.provider.awareness.getStates().values()).filter((state): state is User => 
      state && typeof state === 'object' && 'id' in state
    ) as User[];
  }

  onPresenceChange(cb: (users: User[]) => void) {
    if (!this.provider) return;
    const update = () => cb(this.getOnlineUsers());
    this.provider.awareness.on('change', update);
    update(); // Initial
    return () => this.provider!.awareness.off('change', update);
  }

  broadcastRaw(input: ContainerInput) {
    if (this.provider) {
      // Ephemeral broadcast via awareness or custom map
      const broadcastMap = this.ydoc.getMap('broadcast');
      broadcastMap.set(Date.now().toString(), input);
      // Auto-clean old entries if needed
    }
  }

  async broadcastProcessed(input: ContainerInput) {
    if (!this.engine) throw new Error('Engine required for processing');
    const output = await this.engine.process(input);
    this.broadcastRaw(output as any);
    return output;
  }

  getLogs() {
    return this.logs.toArray();
  }

  pipeToContainer(input: ContainerInput) {
    if (this.engine) {
      return this.engine.process(input);
    }
    return Promise.resolve({} as any);
  }

  sendMessage(message: string) {
    const user = this.provider?.awareness.getLocalState() as User;
    if (user) {
      const chatMessage: ChatMessage = {
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

  onMessage(cb: (messages: ChatMessage[]) => void) {
    const update = () => cb(this.messages.toArray() as ChatMessage[]);
    this.messages.observe(update);
    update(); // Initial call
    return () => this.messages.unobserve(update);
  }

  shareFile(metadata: FileMetadata) {
    this.fileMetadata.set(metadata.id, metadata);
  }

  onFileShared(cb: (files: Map<string, FileMetadata>) => void) {
    const update = () => cb(new Map(Array.from(this.fileMetadata.entries()) as [string, FileMetadata][]));
    this.fileMetadata.observe(update);
    update(); // Initial call
    return () => this.fileMetadata.unobserve(update);
  }

  // Offline-first methods
  private async processOfflineQueue() {
    if (!isIndexedDBAvailable()) return;

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
        } catch (error) {
          console.error('Failed to sync offline operation:', op, error);
          // Keep operation in queue for retry
        }
      }
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  private async syncCreateOperation(op: any) {
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

  private async syncUpdateOperation(op: any) {
    switch (op.store) {
      case 'midi_logs':
        // Find and update in logs array
        const logsArray = this.logs.toArray();
        const logIndex = logsArray.findIndex((log: any) => log.id === op.data.id);
        if (logIndex >= 0) {
          this.logs.delete(logIndex, 1);
          this.logs.insert(logIndex, [op.data]);
        }
        break;
      case 'chat_history':
        // Find and update in messages array
        const messagesArray = this.messages.toArray();
        const messageIndex = messagesArray.findIndex((msg: any) => msg.id === op.data.id);
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

  private async syncDeleteOperation(op: any) {
    switch (op.store) {
      case 'midi_logs':
        const logsArray = this.logs.toArray();
        const logIndex = logsArray.findIndex((log: any) => log.id === op.data.id);
        if (logIndex >= 0) {
          this.logs.delete(logIndex, 1);
        }
        break;
      case 'chat_history':
        const messagesArray = this.messages.toArray();
        const messageIndex = messagesArray.findIndex((msg: any) => msg.id === op.data.id);
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
  private async queueOfflineOperation(type: 'create' | 'update' | 'delete', store: string, data: any) {
    if (!isIndexedDBAvailable()) return;

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
  async sendMessageOfflineFirst(message: string) {
    const user = this.provider?.awareness.getLocalState() as User;
    if (!user) return;

    const chatMessage: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      content: message,
      timestamp: Date.now(),
      type: 'message'
    };

    if (this.isOnline) {
      this.messages.push([chatMessage]);
    } else {
      // Store locally when offline
      if (isIndexedDBAvailable()) {
        await storage.createChatMessage(chatMessage);
      }
      // Queue for sync when online
      await this.queueOfflineOperation('create', 'chat_history', chatMessage);
    }
  }

  async logMidiEventOfflineFirst(event: MidiLogEntry) {
    if (this.isOnline) {
      this.logs.push([event]);
    } else {
      // Store locally when offline
      if (isIndexedDBAvailable()) {
        await storage.createMidiLog(event);
      }
      // Queue for sync when online
      await this.queueOfflineOperation('create', 'midi_logs', event);
    }
  }

  async shareFileOfflineFirst(metadata: FileMetadata) {
    if (this.isOnline) {
      this.fileMetadata.set(metadata.id, metadata);
    } else {
      // Store locally when offline
      if (isIndexedDBAvailable()) {
        await storage.createSharedFile(metadata);
      }
      // Queue for sync when online
      await this.queueOfflineOperation('create', 'shared_files', metadata);
    }
  }
}