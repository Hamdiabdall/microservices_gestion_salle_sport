#!/bin/bash

# Set environment variables to skip verification
export GONOSUMDB=*
export GOSUMDB=off
export GONOPROXY=*
export GOPROXY=direct

# Remove the existing go.sum
rm -f go.sum

# Create vendor directory to ensure dependencies are local
go mod vendor

# Reinitialize the go modules
go mod tidy -e

# Clear go module cache
go clean -modcache

# Download dependencies with verification disabled
go mod download -x

echo "Go modules fixed and vendored for local build."
