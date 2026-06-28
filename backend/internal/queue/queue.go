package queue

import (
	"backend/internal/ws"
	"backend/models"
	"context"
)

// DownloadService is the interface the queue workers call to process a job.
type DownloadService interface {
	ProcessDownloadJob(ctx context.Context, job models.Job, progressChan chan<- models.ProgressMessage) error
}

type Queue struct {
	jobs    chan models.Job
	hub     *ws.Hub
	service DownloadService
}

// NewQueue returns a Queue with a buffered job channel of bufferSize capacity.
func NewQueue(hub *ws.Hub, svc DownloadService, bufferSize int) *Queue {
	return &Queue{
		jobs:    make(chan models.Job, bufferSize),
		hub:     hub,
		service: svc,
	}
}

// AddJob enqueues a job for processing.
func (q *Queue) AddJob(job models.Job) {
	q.jobs <- job
}

// StartWorkers launches count background goroutines that drain the job queue.
func (q *Queue) StartWorkers(count int) {
	for i := 0; i < count; i++ {
		go q.worker()
	}
}

func (q *Queue) worker() {
	for job := range q.jobs {
		progressChan := make(chan models.ProgressMessage)

		// Relay progress messages to the WebSocket hub.
		go func(jid string) {
			for msg := range progressChan {
				msg.JobID = jid
				q.hub.Broadcast(jid, msg)
			}
		}(job.ID)

		err := q.service.ProcessDownloadJob(context.Background(), job, progressChan)

		if err != nil {
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "error", Message: err.Error()})
		} else {
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "complete", Message: "Download ready"})
		}

		close(progressChan)
	}
}
