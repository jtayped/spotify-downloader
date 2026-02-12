# backend/Dockerfile

# 1. Use Go 1.25 to match your go.mod requirement
FROM golang:1.25-alpine AS builder

WORKDIR /app

# 2. Copy go.mod and go.sum from the 'backend' folder
#    (Since build context is root, we must specify 'backend/')
COPY backend/go.mod backend/go.sum ./

# 3. Download dependencies
RUN go mod download

# 4. Copy the rest of the backend source code
COPY backend/ .

# 5. Build the Go binary
RUN go build -o main .

# --- Final Stage ---
FROM alpine:latest
WORKDIR /root/

# 6. Copy the binary from the builder stage
COPY --from=builder /app/main .

# 7. Expose the port (Standard for Go is often 8080)
EXPOSE 8080

# 8. Run the app
CMD ["./main"]