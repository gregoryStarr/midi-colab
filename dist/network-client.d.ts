import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { User, ContainerInput, ChatMessage, MidiLogEntry, FileMetadata } from './types';
import type { WebContainerEngine } from './web-container-engine';
export declare class NetworkClient {
    wsUrl: string;
    engine?: WebContainerEngine | undefined;
    private provider;
    private ydoc;
    private logs;
    private messages;
    private fileMetadata;
    private isOnline;
    constructor(wsUrl: string, engine?: WebContainerEngine | undefined);
    connect(): Promise<void>;
    disconnect(): void;
    getProvider(): WebsocketProvider | null;
    onMidiEvent(callback: (midiData: any, clientId: number) => void): () => void;
    setLocalUser(user: User): void;
    getOnlineUsers(): User[];
    onPresenceChange(cb: (users: User[]) => void): (() => void) | undefined;
    broadcastRaw(input: ContainerInput): void;
    broadcastProcessed(input: ContainerInput): Promise<import("./types").ContainerOutput>;
    getLogs(): Y.Map<unknown>;
    pipeToContainer(input: ContainerInput): Promise<any>;
    sendMessage(message: string): void;
    onMessage(cb: (messages: ChatMessage[]) => void): () => void;
    shareFile(metadata: FileMetadata): void;
    onFileShared(cb: (files: Map<string, FileMetadata>) => void): () => void;
    private processOfflineQueue;
    private syncCreateOperation;
    private syncUpdateOperation;
    private syncDeleteOperation;
    private queueOfflineOperation;
    sendMessageOfflineFirst(message: string): Promise<void>;
    logMidiEventOfflineFirst(event: MidiLogEntry): Promise<void>;
    shareFileOfflineFirst(metadata: FileMetadata): Promise<void>;
}
//# sourceMappingURL=network-client.d.ts.map