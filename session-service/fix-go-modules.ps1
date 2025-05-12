# Navigate to the session-service directory
cd $PSScriptRoot

# Remove the go.sum file completely
Remove-Item -Force go.sum -ErrorAction SilentlyContinue

# Run go mod tidy to regenerate go.sum with correct checksums
go mod tidy

# Verify the modules
go mod verify

Write-Host "Go modules fixed and verified."
