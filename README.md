# guide-example-service

A small HTTP service. It listens on :8080, exposes a health check at /healthz,
and authenticates to a downstream with a short-lived service credential.

## Files

- `server.js` - HTTP server, listens on port 8080, health check at `/healthz`
- `Dockerfile` - builds the image on node:20-alpine

## Configuration

- `SERVICE_TOKEN_TTL_MS` (default `300000`) - service credential lifetime.
- `SERVICE_TOKEN_ISSUED_AT` (optional) - epoch milliseconds the credential was
  issued; defaults to the process start time.
- `HEARTBEAT_INTERVAL_MS` (default `5000`)
- `TOKEN_REFRESH_INTERVAL_MS` (default `60000`)

## Run locally

    docker build -t guide-example-service .
    docker run --rm -p 8080:8080 guide-example-service
    curl localhost:8080
