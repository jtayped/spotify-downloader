package queue

import (
	"backend/internal/ws"
	"backend/models" // Import models
	"context"
)

// Define the interface for the worker logic
type DownloadService interface {
	ProcessDownloadJob(ctx context.Context, job models.Job, progressChan chan<- models.ProgressMessage) error
}

type Queue struct {
	jobs    chan models.Job
	hub     *ws.Hub
	service DownloadService
}

func NewQueue(hub *ws.Hub, svc DownloadService) *Queue {
	return &Queue{
		jobs:    make(chan models.Job, 100),
		hub:     hub,
		service: svc,
	}
}

func (q *Queue) AddJob(job models.Job) {
	q.jobs <- job
}

func (q *Queue) StartWorkers(count int) {
	for i := 0; i < count; i++ {
		go q.worker()
	}
}

func (q *Queue) worker() {
	for job := range q.jobs {
		progressChan := make(chan models.ProgressMessage)

		// Relay progress to WebSocket Hub
		go func(jid string) {
			for msg := range progressChan {
				msg.JobID = jid
				q.hub.Broadcast(jid, msg)
			}
		}(job.ID)

		// Do work
		err := q.service.ProcessDownloadJob(context.Background(), job, progressChan)
		
		if err != nil {
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "error", Message: err.Error()})
		} else {
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "complete", Message: "Download ready"})
		}
		
		close(progressChan)
	}
}