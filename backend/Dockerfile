FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates ffmpeg curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 1323

# Self-update yt-dlp on each start so the container stays current without a rebuild.
# The update is best-effort — if the network is unavailable, startup continues anyway.
CMD ["sh", "-c", "yt-dlp -U --quiet 2>&1 || true; ./main"]
