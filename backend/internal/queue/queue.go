package queue

import (
	"backend/internal/ws"
	"backend/models"
	"context"
	"log"
	"time"
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
		log.Printf("[job %s] started (%s)", job.ID[:8], job.Type)
		start := time.Now()

		progressChan := make(chan models.ProgressMessage)

		// Relay progress messages to the WebSocket hub.
		go func(jid string) {
			for msg := range progressChan {
				msg.JobID = jid
				q.hub.Broadcast(jid, msg)
			}
		}(job.ID)

		err := q.service.ProcessDownloadJob(context.Background(), job, progressChan)
		elapsed := time.Since(start)

		if err != nil {
			log.Printf("[job %s] failed after %v: %v", job.ID[:8], elapsed.Round(time.Millisecond), err)
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "error", Message: err.Error()})
		} else {
			log.Printf("[job %s] complete in %v", job.ID[:8], elapsed.Round(time.Millisecond))
			q.hub.Broadcast(job.ID, models.ProgressMessage{Type: "complete", Message: "Download ready"})
		}

		close(progressChan)
	}
}
