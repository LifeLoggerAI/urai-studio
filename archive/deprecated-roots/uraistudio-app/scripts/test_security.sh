#!/bin/bash

# This is a placeholder for a real security test.
# In a real-world scenario, you would use a testing framework to write more
# comprehensive tests against the emulator.

set -e

echo "Running security tests..."

# Test: Unauthenticated read should fail
if curl -s http://localhost:8080/v1/projects/demo-urai-studio/databases/(default)/documents/studioUsers/test-user | grep -q '200'; then
  echo "Security test failed: Unauthenticated read was successful."
  exit 1
fi

# Test: Unauthenticated write should fail
if curl -s -X POST http://localhost:8080/v1/projects/demo-urai-studio/databases/(default)/documents/studioUsers/new-user -d '{"fields": {"email": {"stringValue": "hacker@example.com"}}}' | grep -q '200'; then
    echo "Security test failed: Unauthenticated write was successful."
    exit 1
fi



echo "Security tests passed!"
