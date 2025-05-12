FROM golang:1.16-alpine AS builder

# Install git and build dependencies
RUN apk add --no-cache git bash

# Disable Go module verification
ENV GO111MODULE=on
ENV GONOSUMDB=*
ENV GOSUMDB=off
ENV GONOPROXY=*
ENV GOPROXY=direct

# Set workdir
WORKDIR /app

# First just copy go.mod and go.sum
COPY go.mod go.sum* ./

# Then copy the proto directory which is needed for imports
COPY proto/ proto/

# Then explicitly download dependencies with verification disabled
RUN go mod download -x

# Now copy the rest of the source code
COPY . .

# Create a vendor directory to ensure all dependencies are local
RUN go mod vendor

# Build the application (the -mod=vendor ensures it uses local dependencies)
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o service

# Create a minimal production image
FROM alpine:latest

# Install CA certificates 
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the executable and proto files
COPY --from=builder /app/service .
COPY --from=builder /app/proto ./proto/

# Expose gRPC port
EXPOSE 50051

# Run the service
CMD ["/root/service"]
