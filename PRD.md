# Product Requirements Document (PRD): MIDI-Colab High-Performance Architecture

## Goal

Build a modular, performant, and scalable MIDI collaboration library (`midi-colab`) using a layered approach that decouples UI, network sync, and intensive MIDI processing.

## High-Performance Layered Architecture

The system is organized into three distinct execution layers to ensure zero-jitter MIDI throughput and a responsive UI.

### 1. Main Layer (UI & Network)
*   **Responsibility**: React UI rendering, User Presence, and high-level Orchestration.
*   **Presence & Sync**: Powered by **Yjs** and **y-websocket**.
    *   Uses Yjs Awareness for real-time peer tracking.
    *   Broadcasts ephemeral MIDI events for low-latency collaboration.
*   **Collaboration Features**:
    *   **Real-time Chat**: Synchronized messaging using a shared `Y.Array`.
    *   **File Sharing Orchestration**: Metadata synchronization for shared assets (MIDI files, samples, scripts).
*   **State Management**: Synchronizes the "active script" and project configuration across peers.

### 2. Orchestration Layer (Web Workers)
*   **Responsibility**: Interception, Monitoring, and Proxying.
*   **MIDI Interceptor**: A dedicated Web Worker that monitors the `MidiBridge` stream.
*   **File Transfer Proxy**: Handles binary data chunking and transfer between the UI, IndexedDB, and the WebContainer environment to prevent blocking the main thread.
*   **Routing Logic**: Intercepts raw MIDI requests and proxies them to the WebContainer via `postMessage`.

### 3. Execution Layer (WebContainers)
*   **Responsibility**: Intensive MIDI processing and sandboxed script execution.
*   **Processing**: Handles analysis, algorithmic composition, and music theory logic (via **Tonal**).
*   **File System Integration**: User scripts interact with shared files directly within the WebContainer's virtual file system.
*   **Isolation**: User scripts run in a StackBlitz WebContainer, ensuring security and preventing rogue scripts from crashing the browser tab.

## Data & Persistence Layer

*   **Persistence**: Uses the **IndexedDB API** for local storage.
    *   **MIDI Logs**: High-volume event history.
    *   **Chat History**: Persistent local cache of collaborative messages.
    *   **File Store**: Storage for shared binary assets (samples, recordings, and scripts).
    *   **Session State**: Caching remote state for offline-first capabilities.

## Technical Specifications

### Data Structures
*   `MidiPacket`: Encapsulated MIDI data with high-resolution timestamps and routing metadata.
*   `ProcessingPipe`: Interface for scripts to receive `MidiPacket` and return processed results via the Worker proxy.

## Implementation Roadmap

1.  **Orchestrator Scaffolding**: Implement the Web Worker to Main Thread communication bridge.
2.  **WebContainer Integration**: Port the `WebContainerEngine` to handle requests exclusively via the Worker proxy.
3.  **IndexedDB Strategy**: Implement a storage schema for MIDI event logging and script persistence.
4.  **Verification**: Benchmarking MIDI latency between the Hardware -> Worker -> WebContainer -> UI path.
