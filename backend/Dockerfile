FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates python3 py3-pip ffmpeg \
    && pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 1323

CMD ["./main"]
