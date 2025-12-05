# 1. Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
# Build the binary. 
# CGO_ENABLED=0 is important for creating a static binary that runs on Alpine
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 2. Run Stage
FROM alpine:latest

WORKDIR /root/

# Install dependencies for yt-dlp:
# - ca-certificates: for HTTPS requests
# - python3: runtime required for yt-dlp
# - ffmpeg: required for merging video/audio formats
# - curl: used to download the yt-dlp binary below
RUN apk --no-cache add \
    ca-certificates \
    python3 \
    ffmpeg \
    curl

# Download the latest yt-dlp binary directly from GitHub
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy the binary from the builder stage
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]