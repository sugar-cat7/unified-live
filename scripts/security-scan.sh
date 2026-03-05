#!/bin/bash
# Security scan script for local development
# Runs security checks using Docker containers (no local tool installation required)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track failures
FAILED=0

echo -e "${YELLOW}=== Security Scan (Docker) ===${NC}"
echo ""

# 1. Trivy filesystem scan
echo -e "${YELLOW}[1/4] Running Trivy filesystem scan...${NC}"
if docker run --rm -v "$(pwd)":/work -w /work aquasec/trivy:latest fs --severity CRITICAL,HIGH --exit-code 1 --ignorefile .trivyignore .; then
  echo -e "${GREEN}Trivy filesystem scan passed${NC}"
else
  echo -e "${RED}Trivy filesystem scan found vulnerabilities${NC}"
  FAILED=1
fi
echo ""

# 2. gitleaks (secret detection)
echo -e "${YELLOW}[2/3] Running gitleaks...${NC}"
if docker run --rm -v "$(pwd)":/work -w /work zricethezav/gitleaks:latest detect --source . --no-banner 2>/dev/null; then
  echo -e "${GREEN}gitleaks passed - no secrets found${NC}"
else
  echo -e "${RED}gitleaks found potential secrets${NC}"
  FAILED=1
fi
echo ""

# 3. Semgrep (SAST)
echo -e "${YELLOW}[3/3] Running Semgrep...${NC}"
if docker run --rm -v "$(pwd)":/src semgrep/semgrep:latest semgrep scan --config auto --quiet 2>/dev/null; then
  echo -e "${GREEN}Semgrep passed${NC}"
else
  echo -e "${RED}Semgrep found issues${NC}"
  FAILED=1
fi
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}=== All security scans passed ===${NC}"
  exit 0
else
  echo -e "${RED}=== Some security scans failed ===${NC}"
  exit 1
fi
