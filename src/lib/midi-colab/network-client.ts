import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { User, ContainerInput, ChatMessage, MidiLogEntry, FileMetadata } from './types';
import type { WebContainerEngine } from './web-container-engine';
import { storage, isIndexedDBAvailable } from './storage';

/**
 * Handles real-time synchronization and network communication.
 * 
 * The NetworkClient uses Yjs and y-websocket to synchronize state across
 * connected clients. It manages presence, chat messages, shared files,
 * and MIDI event broadcasting. It also implements an offline-first
 * architecture using IndexedDB to queue operations when disconnected.
 */
export class NetworkClient {
  private provider: WebsocketProvider | null = null;
  private ydoc = new Y.Doc();
  private logs = this.ydoc.getArray('logs');
  private messages = this.ydoc.getArray('messages');
  private fileMetadata = this.ydoc.getMap('files');
  private isOnline = false;

  constructor(public wsUrl: string, public engine?: WebContainerEngine) {}

  /**
   * Connects to the WebSocket server and initializes the synchronization provider.
   * Sets up connection status listeners and triggers the processing of the offline queue
   * upon successful connection.
   */
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

  /**
   * Disconnects from the WebSocket server and destroys the provider.
   */
  disconnect() {
    this.isOnline = false;
    this.provider?.destroy();
    this.provider = null;
  }

  /**
   * Returns the underlying Yjs WebsocketProvider instance.
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Subscribes to remote MIDI events.
   * Monitors the Yjs awareness state for changes in 'currentMidi' from other clients.
   * 
   * @param callback Function to execute when a remote MIDI event is received.
   * @returns A cleanup function to unsubscribe.
   */
  onMidiEvent(callback: (midiData: any, clientId: number) => void) {
    if (!this.provider) return () => {};

    const awareness = this.provider.awareness;
    const handler = (_changes: any) => {
      const states = awareness.getStates();
      states.forEach((state: any, clientId: number) => {
        if (state && state.currentMidi && clientId !== awareness.clientID) {
          callback(state.currentMidi, clientId);
        }
      });
    };

    awareness.on('change', handler);
    return () => awareness.off('change', handler);
  }

  /**
   * Updates the local user's presence state in the awareness protocol.
   * 
   * @param user The user object to set as the local state.
   */
  setLocalUser(user: User) {
    if (this.provider) {
      this.provider.awareness.setLocalState(user);
    }
  }

  /**
   * Retrieves a list of all currently online users from the awareness state.
   */
  getOnlineUsers(): User[] {
    if (!this.provider) return [];
    return Array.from(this.provider.awareness.getStates().values()).filter((state): state is User => 
      !!(state && typeof state === 'object' && 'id' in state)
    ) as User[];
  }

  /**
   * Subscribes to changes in the list of online users.
   * 
   * @param cb Callback function to execute when presence changes.
   * @returns A cleanup function to unsubscribe.
   */
  onPresenceChange(cb: (users: User[]) => void) {
    if (!this.provider) return;
    const update = () => cb(this.getOnlineUsers());
    this.provider.awareness.on('change', update);
    update(); // Initial
    return () => this.provider!.awareness.off('change', update);
  }

  /**
   * Broadcasts raw MIDI input to other clients.
   * Uses a Yjs map with short-lived keys to emit events.
   * 
   * @param input The container input to broadcast.
   */
  broadcastRaw(input: ContainerInput) {
    if (this.provider) {
      // Use Yjs map for reliable cross-tab broadcasting
      const broadcastMap = this.ydoc.getMap('broadcast');
      // Use client ID + timestamp for unique keys to avoid collisions
      const clientId = this.provider.awareness.clientID || 'unknown';
      const key = `${clientId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('NetworkClient: broadcasting MIDI via map with key:', key, 'data:', input);
      broadcastMap.set(key, input);
    } else {
      console.log('NetworkClient: no provider, cannot broadcast');
    }
  }

  /**
   * Processes input via the WebContainerEngine and then broadcasts the result.
   * 
   * @param input The container input to process.
   * @throws Error if the engine is not initialized.
   */
  async broadcastProcessed(input: ContainerInput) {
    if (!this.engine) throw new Error('Engine required for processing');
    const output = await this.engine.process(input);
    this.broadcastRaw(output as any);
    return output;
  }

  /**
   * Returns the shared 'broadcast' map from the Yjs document.
   */
  getLogs() {
    return this.ydoc.getMap('broadcast');
  }

  /**
   * Pipes input directly to the WebContainerEngine without broadcasting.
   * 
   * @param input The container input to process.
   */
  pipeToContainer(input: ContainerInput) {
    if (this.engine) {
      return this.engine.process(input);
    }
    return Promise.resolve({} as any);
  }

  /**
   * Sends a chat message.
   * Appends the message to the shared 'messages' array.
   * 
   * @param message The content of the message.
   */
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

  /**
   * Subscribes to updates in the chat message history.
   * 
   * @param cb Callback function to execute when messages change.
   * @returns A cleanup function to unsubscribe.
   */
  onMessage(cb: (messages: ChatMessage[]) => void) {
    const update = () => cb(this.messages.toArray() as ChatMessage[]);
    this.messages.observe(update);
    update(); // Initial call
    return () => this.messages.unobserve(update);
  }

  /**
   * Shares file metadata with other clients.
   * Updates the shared 'files' map.
   * 
   * @param metadata The metadata of the file to share.
   */
  shareFile(metadata: FileMetadata) {
    this.fileMetadata.set(metadata.id, metadata);
  }

  /**
   * Subscribes to updates in the shared file list.
   * 
   * @param cb Callback function to execute when shared files change.
   * @returns A cleanup function to unsubscribe.
   */
  onFileShared(cb: (files: Map<string, FileMetadata>) => void) {
    const update = () => cb(new Map(Array.from(this.fileMetadata.entries()) as [string, FileMetadata][]));
    this.fileMetadata.observe(update);
    update(); // Initial call
    return () => this.fileMetadata.unobserve(update);
  }

  // Offline-first methods
  
  /**
   * Processes queued offline operations by attempting to sync them with the server.
   * This is called when the client comes back online.
   */
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
  
  /**
   * Sends a chat message with offline support.
   * If online, behaves like `sendMessage`.
   * If offline, stores the message locally and queues it for sync.
   * 
   * @param message The content of the message.
   */
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

  /**
   * Logs a MIDI event with offline support.
   * 
   * @param event The MIDI log entry to record.
   */
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

  /**
   * Shares a file via metadata with offline support.
   * 
   * @param metadata The file metadata.
   */
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