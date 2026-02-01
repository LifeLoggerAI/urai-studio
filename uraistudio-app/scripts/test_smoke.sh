#!/bin/bash

# This is a placeholder for a real smoke test.
# In a real-world scenario, you would use a testing framework like Jest or Mocha
# to write more comprehensive tests.

set -e

echo "Running smoke tests..."

# Test: Create a job
JOB_ID=$(curl -s -X POST http://localhost:8080/v1/projects/demo-urai-studio/databases/(default)/documents/studioJobs -d '{"fields": {"projectId": {"stringValue": "test-project"}, "status": {"stringValue": "pending"}, "ownerId": {"stringValue": "test-user"}}}' | grep -o 'projects/demo-urai-studio/databases/(default)/documents/studioJobs/[^"]*' | cut -d '/' -f 6)


if [ -z "$JOB_ID" ]; then
  echo "Smoke test failed: Could not create job."
  exit 1
fi

echo "Created job with ID: $JOB_ID"

# Test: Poll for job completion
TIMEOUT=60
INTERVAL=5
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(curl -s http://localhost:8080/v1/projects/demo-urai-studio/databases/(default)/documents/studioJobs/$JOB_ID | grep -o '"status": "[^"]*''' | cut -d ''' -f 4)
  if [ "$STATUS" == "complete" ]; then
    echo "Job completed successfully."
    break
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ "$STATUS" != "complete" ]; then
  echo "Smoke test failed: Job did not complete within the timeout period."
  exit 1
fi

# Test: Check for output
OUTPUT_URL=$(curl -s "http://localhost:8080/v1/projects/demo-urai-studio/databases/(default)/documents/studioOutputs" | grep "output.mp4")

if [ -z "$OUTPUT_URL" ]; then
    echo "Smoke test failed: No output URL found."
    exit 1
fi

echo "Smoke tests passed!"
