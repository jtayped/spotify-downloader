package ws

import (
	"backend/models"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients map[string][]*websocket.Conn
	mu      sync.RWMutex
}

// NewHub returns an initialised Hub ready to register clients and broadcast messages.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[string][]*websocket.Conn),
	}
}

// Register adds a WebSocket connection to the job's subscriber list.
func (h *Hub) Register(jobID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[jobID] = append(h.clients[jobID], conn)
}

// Broadcast sends msg to every connection subscribed to jobID.
// Connections that return a write error are considered dead: they are closed
// and removed from the map. If the subscriber list for a job becomes empty,
// the job key is deleted.
func (h *Hub) Broadcast(jobID string, msg models.ProgressMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()

	conns, ok := h.clients[jobID]
	if !ok {
		return
	}

	alive := conns[:0] // reuse backing array
	for _, conn := range conns {
		if err := conn.WriteJSON(msg); err != nil {
			conn.Close()
			continue
		}
		alive = append(alive, conn)
	}

	if len(alive) == 0 {
		delete(h.clients, jobID)
	} else {
		h.clients[jobID] = alive
	}
}
