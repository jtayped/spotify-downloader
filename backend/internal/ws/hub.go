package ws

import (
	"backend/models" // Import models
	"sync"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients map[string][]*websocket.Conn
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string][]*websocket.Conn),
	}
}

func (h *Hub) Register(jobID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[jobID] = append(h.clients[jobID], conn)
}

func (h *Hub) Broadcast(jobID string, msg models.ProgressMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, ok := h.clients[jobID]
	if !ok {
		return
	}

	for _, conn := range conns {
		conn.WriteJSON(msg)
	}
}