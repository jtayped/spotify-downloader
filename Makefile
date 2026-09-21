# Prerequisites:
#   go install github.com/air-verse/air@latest  (live reload)
#   go install github.com/gzuidhof/tygo@latest  (type generation)
#   npm install (run once in frontend/)

.PHONY: backend backend-dev frontend gen dev docker-up docker-down

# Run the Go backend (no live reload)
backend:
	cd backend && go run .

# Run the Go backend with live reload via air
backend-dev:
	cd backend && air

# Run the Next.js frontend dev server
frontend:
	cd frontend && npm run dev

# Regenerate TypeScript types from Go models
# Run this whenever you change backend/models/types.go
gen:
	tygo generate

# Start production stack via Docker
docker-up:
	docker compose up --build

docker-down:
	docker compose down
