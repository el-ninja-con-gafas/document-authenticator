#!/bin/bash

set -e

if [ -f .env ]; then
  source .env
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE:-document-authenticator.log}"
}

print_header() {
  echo -e "${BLUE}$1${NC}"
}

print_success() {
  echo -e "${GREEN}$1${NC}"
  log "INFO" "$1"
}

print_error() {
  echo -e "${RED}$1${NC}"
  log "ERROR" "$1"
}

print_warning() {
  echo -e "${YELLOW}$1${NC}"
  log "WARN" "$1"
}

validate_environment() {
  print_header "Validating Environment"
  
  local required_tools=("git" "sha256sum")
  for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
      print_error "$tool is not installed"
      return 1
    fi
  done
  
  local required_vars=("AUTO_COMMIT" "GIT_EMAIL" "GIT_USERNAME" "GIT_REPOSITORY")
  for var in "${required_vars[@]}"; do
    if [ -z "${!var+x}" ]; then
      print_error "$var environment variable not set"
      return 1
    fi
  done
  
  print_success "All required tools and environment variables available"
  return 0
}

if [ $# -lt 1 ]; then
  cat << USAGE
Usage: $0 <document_path> [options]

Options:
  --no-commit        Skip git commit and push
  --help             Show this help message

Example:
  $0 input/BNT202410272317S.pdf
USAGE
  exit 1
fi

DOCUMENT_PATH="$1"
shift

SKIP_COMMIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-commit)
      SKIP_COMMIT=true
      shift
      ;;
    --help)
      cat << USAGE
Usage: $0 <document_path> [options]

Options:
  --no-commit        Skip git commit and push
  --help             Show this help message
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

validate_environment || exit 1

if [ ! -f "$DOCUMENT_PATH" ]; then
  print_error "Document not found: $DOCUMENT_PATH"
  exit 1
fi

REFERENCE_NUMBER=$(basename "$DOCUMENT_PATH" | sed 's/\.[^.]*$//')
DOCUMENT_DIR=$(dirname "$DOCUMENT_PATH")

print_success "Document found: $REFERENCE_NUMBER.pdf"

print_header "Step 1: Generating Verification ID"

VERIFICATION_ID=$(sha256sum "$DOCUMENT_PATH" | awk '{print $1}')

print_success "Verification ID: $VERIFICATION_ID"
log "INFO" "Verification ID: $VERIFICATION_ID"

print_header "Step 2: Creating Verification Directory"

VERIFY_DIRECTORY="records/$VERIFICATION_ID"
if mkdir -p "$VERIFY_DIRECTORY"; then
    print_success "Directory created: $VERIFY_DIRECTORY"
    log "INFO" "Created directory: $VERIFY_DIRECTORY"
else
    print_error "Failed to create directory: $VERIFY_DIRECTORY"
    log "ERROR" "Could not create directory: $VERIFY_DIRECTORY"
    exit 1
fi

print_header "Step 3: Creating Document Configuration"

source scripts/extract_issue_date.sh

ISSUE_DATE="$(extract_issue_date "$REFERENCE_NUMBER")"
ORG_NAME="BitNinja Technology"
ORG_DOMAIN="bitninja.net"

cat > "$VERIFY_DIRECTORY/config.json" << EOF
{
  "verificationId": "$VERIFICATION_ID",
  "referenceNumber": "$REFERENCE_NUMBER",
  "issueDate": "$ISSUE_DATE",
  "organization": {
    "name": "$ORG_NAME",
    "domain": "$ORG_DOMAIN"
  }
}
EOF

print_success "Configuration file created: $VERIFY_DIRECTORY/config.json"
log "INFO" "Created config.json for verification ID: $VERIFICATION_ID"

print_header "Step 4: Creating Index File"

cat > "$VERIFY_DIRECTORY/index.html" << 'HTML_TEMPLATE'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0;url=/document-authenticator/">
    <title>Document Verification Redirect</title>
</head>
<body>
    <p>Redirecting to verification page...</p>
</body>
</html>
HTML_TEMPLATE

print_success "Index template created: $VERIFY_DIRECTORY/index.html"
log "INFO" "Created index.html for verification ID: $VERIFICATION_ID"

if [ "$SKIP_COMMIT" = false ]; then
  print_header "Step 5: Deploying to GitHub Pages"
  
  if [ "$AUTO_COMMIT" = "true" ]; then
    COMMIT_MSG="Add document: $REFERENCE_NUMBER ($VERIFICATION_ID)"
    
    log "INFO" "Committing changes to git"
    git add "$VERIFY_DIRECTORY"
    git commit -m "$COMMIT_MSG"
    
    if [ $? -eq 0 ]; then
      log "INFO" "Pushing to GitHub"
      git config user.email "$GIT_EMAIL" 2>/dev/null || true
      git config user.name "$GIT_USERNAME" 2>/dev/null || true
      git remote add origin "$GIT_REPOSITORY" 2>/dev/null || true
      git push origin master -u
      
      if [ $? -eq 0 ]; then
        print_success "Changes pushed to GitHub"
        log "INFO" "Git push successful"
      else
        print_warning "Git push failed"
        log "WARN" "Git push failed"
      fi
    else
      print_warning "Git commit failed (no changes or git not configured)"
      log "WARN" "Git commit failed"
    fi
  else
    print_warning "Auto-commit disabled in configuration"
    log "INFO" "Auto-commit disabled"
  fi
else
  print_warning "Git deployment skipped"
  log "INFO" "Git deployment skipped"
fi

print_header "Document Added Successfully"

cat << SUMMARY
Reference Number:     $REFERENCE_NUMBER
Issue Date:           $ISSUE_DATE
Verification ID:      $VERIFICATION_ID
SUMMARY

log "INFO" "Document successfully added: $REFERENCE_NUMBER ($VERIFICATION_ID)"
echo -e "\n${GREEN}Document successfully added to authentication system${NC}\n"
