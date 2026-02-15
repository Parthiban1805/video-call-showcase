# System Architecture & Flows

This document details the system design, communication patterns, and data flows of the Video Conferencing application. The diagrams below illustrate the high-level architecture, authentication processes, and the core real-time signaling mechanism used for WebRTC connections.

---

## 1. High-Level System Architecture

This diagram illustrates the overall structure of the application, including the client-side React application, the Node.js/Express backend, the real-time Socket.IO layer, the Mediasoup SFU (Selective Forwarding Unit) workers, and the MongoDB database.

```mermaid
graph TD
    subgraph "Client Side"
        Client["React Client (Vite)"]
        Browser["Browser APIs (WebRTC, MediaDevices)"]
    end

    subgraph "Server Side (Node.js)"
        API["Express API Server"]
        Socket["Socket.IO Server"]
        RoomMgr["Room Manager (In-Memory)"]
        SFU["Mediasoup Workers (SFU)"]
    end

    subgraph "Data Persistence"
        DB[("MongoDB")]
    end

    %% Connections
    Client -->|"HTTP REST API"| API
    Client -->|"WebSocket (Signaling)"| Socket
    Client -->|"WebRTC (RTP Media)"| SFU
    
    API -->|"Auth & User Data"| DB
    Socket -->|"Manage State"| RoomMgr
    RoomMgr -->|"Control"| SFU
    API <-->|"Rate Limiting"| Memory["Memory Store / Redis"]

    %% Styles
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style API fill:#bbf,stroke:#333,stroke-width:2px
    style SFU fill:#ff9,stroke:#333,stroke-width:2px
    style DB fill:#9f9,stroke:#333,stroke-width:2px
```

---

## 2. Authentication Flow (JWT)

This sequence diagram details the secure registration and login process. It highlights input validation, password hashing, and JWT token generation.

```mermaid
sequenceDiagram
    participant User
    participant Client as React Client
    participant API as API Server
    participant DB as MongoDB

    %% Registration
    Note over User, DB: User Registration
    User->>Client: Enters Reg Details
    Client->>API: POST /api/auth/register
    activate API
    API->>API: Validate Inputs (express-validator)
    API->>DB: Check if User Exists
    DB-->>API: User Not Found
    API->>API: Hash Password (bcrypt)
    API->>DB: Save New User
    DB-->>API: Success
    API->>API: Generate JWT
    API-->>Client: 201 Created {token, user}
    deactivate API
    Client->>Client: Store Token (LocalStorage)

    %% Login
    Note over User, DB: User Login
    User->>Client: Enters Credentials
    Client->>API: POST /api/auth/login
    activate API
    API->>API: Rate Limiter Check
    API->>DB: Find User by Email
    DB-->>API: User Document
    API->>API: Compare Password (bcrypt)
    alt Password Match
        API->>API: Generate JWT
        API-->>Client: 200 OK {token, user}
    else Password Mismatch
        API-->>Client: 401 Unauthorized
    end
    deactivate API
```

---

## 3. Real-Time Signaling & Room Join Flow

This is the core logic for video conferencing. It shows how a client joins a room via Socket.IO and initiates the WebRTC handshake with the Mediasoup SFU (simulated in this showcase).

```mermaid
sequenceDiagram
    participant Peer as Client (Peer)
    participant Socket as Socket.IO Server
    participant Room as Room Manager
    participant Mediasoup as Mediasoup Worker (Mock)

    Note over Peer, Mediasoup: 1. Join Room Handling
    Peer->>Socket: emit('join-room', { roomId, peerId })
    Socket->>Room: Handle Join Request
    Room->>Room: Create/Get Room Instance
    Room->>Room: Add Peer to Room State
    Socket-->>Peer: callback({ rtpCapabilities })
    Socket->>Peer: broadcast('peer-joined', { peerId })

    Note over Peer, Mediasoup: 2. WebRTC Transport Setup
    Peer->>Socket: emit('createWebRtcTransport', { direction: 'send' })
    Socket->>Mediasoup: router.createWebRtcTransport()
    Mediasoup-->>Socket: Transport Info { id, iceParams, dtlsParams }
    Socket-->>Peer: callback({ transportOptions })
    
    Peer->>Peer: device.createSendTransport()
    Peer->>Socket: emit('connectTransport', { dtlsParameters })
    Socket->>Mediasoup: transport.connect()
    
    Note over Peer, Mediasoup: 3. Producing Media (Video/Audio)
    Peer->>Peer: transport.produce({ track })
    Peer->>Socket: emit('produce', { kind, rtpParameters })
    Socket->>Mediasoup: transport.produce()
    Mediasoup-->>Socket: Producer ID
    Socket-->>Peer: callback({ producerId })
    
    Note over Peer, Mediasoup: 4. Consuming Media (Viewing Others)
    Socket->>Peer: emit('new-producer', { producerId })
    Peer->>Socket: emit('consume', { producerId, rtpCapabilities })
    Socket->>Mediasoup: transport.consume()
    Mediasoup-->>Socket: Consumer Info { id, rtpParameters }
    Socket-->>Peer: callback({ consumerOptions })
    Peer->>Peer: transport.consume({ consumerOptions })
```

---

## 4. Database Schema (ERD)

Although the primary focus is real-time media, the application maintains persistent user data.

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String name
        String username "Unique, Indexed"
        String password "Hashed"
        String avatar
        Date createdAt
    }

    MEETING_LOG {
        ObjectId _id PK
        String roomId
        Date startTime
        Date endTime
        Array participants
    }

    USER ||--o{ MEETING_LOG : "participates in"
```

## 5. Client State Management

The React client manages complex asynchronous state for media streams and socket connections.

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Connecting: User Clicks "Join"
    Connecting --> Connected: Socket Connected & Device Loaded
    Connecting --> Error: Connection Failed
    
    state Connected {
        [*] --> ConfiguringMedia
        ConfiguringMedia --> Ready: Streams Acquired
        Ready --> SharingScreen: Toggle Screen Share
        SharingScreen --> Ready: Stop Screen Share
        Ready --> Muted: Toggle Audio
        Muted --> Ready: Toggle Audio
    }
    
    Connected --> Disconnected: Leave Room / Network Error
    Disconnected --> Idle: Reset or Reconnect
```
