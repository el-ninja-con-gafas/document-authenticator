const VERIFICATION_BASE_URL = 'https://bitninja.net/document-authenticator';
const ORGANIZATION_NAME = 'BitNinja Technology';
const ORGANIZATION_DOMAIN = 'bitninja.net';

function getLandingPageHTML() {
  return `
    <div class="landing-page">
      <div class="container">
        <h1>Document Authentication System</h1>
        <p class="subtitle">Confirm the authenticity and integrity of official documents issued by BitNinja Technology using advanced cryptographic verification</p>
      </div>
    </div>

    <div class="container">
      <div class="verification-card">
        <h2>Verify Your Document</h2>
        <p>Select a PDF document from your device to verify its authenticity and confirm it was issued by BitNinja Technology:</p>
        
        <div class="upload-section" id="upload-section">
          <label for="file-input">
            <div class="upload-icon">📄</div>
            <p><strong>Click to select a PDF file</strong> or drag and drop</p>
            <p style="font-size: 12px; color: #999;">Maximum file size: 100 MB</p>
          </label>
          <input type="file" id="file-input" accept=".pdf" />
        </div>

        <div class="progress-bar" id="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>

        <div class="error-message" id="error-message"></div>
        <div class="success-message" id="success-message"></div>

        <div id="verification-result" style="display: none; margin-top: var(--spacing-lg);"></div>
      </div>

      <div class="verification-card">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-container">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Upload Document</h3>
            <p>Select a PDF document from your device that you wish to verify.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Calculate SHA256</h3>
            <p>The system calculates the SHA256 cryptographic hash of your document.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Verify Authenticity</h3>
            <p>The hash is checked against our database to verify document authenticity.</p>
          </div>
        </div>
      </div>

      <div class="verification-card">
        <h2 class="section-title">Security & Privacy</h2>
        <div class="info-box">
          <h3>How does this work?</h3>
          <p>Your document is processed entirely on your device. The SHA256 hash is calculated locally without uploading the actual document to our servers. This ensures maximum privacy and security.</p>
          <h3>Verification Process</h3>
          <p>When you upload a document, we compute its SHA256 hash. If this hash matches a document in our authentication registry, the document is verified as authentic. Each verified document is stored in our system with its metadata including issue date and document name.</p>
        </div>
      </div>
    </div>
  `;
}

function getVerificationResultHTML(config) {
  return `
    <div class="verification-card">
      <h2>Document Verified ✓</h2>
      <p style="color: #22c55e; font-weight: 600; margin-bottom: var(--spacing-lg);">This document has been authenticated and verified as genuine.</p>
      
      <h3 style="font-size: 16px; color: var(--color-primary); margin: var(--spacing-lg) 0 var(--spacing-md) 0;">Document Details</h3>
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">Reference Number:</span>
          <span class="metadata-value">${escapeHtml(config.referenceNumber)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Issue Date:</span>
          <span class="metadata-value">${escapeHtml(config.issueDate)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Organization:</span>
          <span class="metadata-value">${escapeHtml(config.organization.name)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Verification ID:</span>
          <span class="metadata-value" style="font-size: 11px;">${escapeHtml(config.verificationId)}</span>
        </div>
      </div>
  `;
}

function getNotFoundResultHTML(verificationHash) {
  return `
    <div class="verification-card">
      <h2 style="color: #ef4444;">Document Not Verified ✗</h2>
      <p style="color: #991b1b; margin-bottom: var(--spacing-lg);">This document could not be found in our authentication registry.</p>
      
      <div class="error-message show" style="display: block;">
        <strong>Verification Failed</strong>
        <p>The document with verification ID <code>${escapeHtml(verificationHash)}</code> was not found in our system. This could mean:</p>
        <ul style="margin: var(--spacing-md) 0; padding-left: var(--spacing-lg);">
          <li>The document has not been authenticated by ${escapeHtml(ORGANIZATION_NAME)}</li>
          <li>The SHA256 hash does not match any verified document</li>
          <li>The document may be inauthentic or tampered with</li>
        </ul>
      </div>

      <div class="info-box">
        <h3 style="color: #dc2626;">What should you do?</h3>
        <ol style="margin: 0; padding-left: var(--spacing-lg);">
          <li>Verify that you are using the correct document file</li>
          <li>Contact ${escapeHtml(ORGANIZATION_NAME)} to confirm document authenticity</li>
          <li>Do not rely on unverified documents for critical purposes</li>
        </ol>
      </div>

      <button class="access-button" onclick="location.reload();" style="width: 100%; margin-top: var(--spacing-lg);">Try Another Document</button>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function calculateSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function updateProgress(percent) {
  const fill = document.getElementById('progress-fill');
  if (fill) {
    fill.style.width = percent + '%';
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
  }
}

function clearError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.classList.remove('show');
  }
}

function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.add('show');
  }
}

function clearSuccess() {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.classList.remove('show');
  }
}

async function handleFileSelect(file) {
  clearError();
  clearSuccess();

  if (!file) {
    return;
  }

  if (file.type !== 'application/pdf') {
    showError('Error: Please select a valid PDF file.');
    return;
  }

  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    showError('Error: File size exceeds 100 MB limit.');
    return;
  }

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.classList.add('active');
  }

  try {
    updateProgress(30);
    const sha256Hash = await calculateSHA256(file);
    updateProgress(100);

    setTimeout(() => {
      performVerification(sha256Hash);
      if (progressBar) {
        progressBar.classList.remove('active');
      }
    }, 500);
  } catch (error) {
    console.error('SHA256 calculation error:', error);
    showError('Error: Unable to calculate file hash. Please try again.');
    if (progressBar) {
      progressBar.classList.remove('active');
    }
  }
}

async function performVerification(sha256Hash) {
  const resultContainer = document.getElementById('verification-result');
  
  try {
    const configPath = `/document-authenticator/${sha256Hash}/config.json`;
    const response = await fetch(configPath);

    if (!response.ok) {
      resultContainer.innerHTML = getNotFoundResultHTML(sha256Hash);
      resultContainer.style.display = 'block';
      resultContainer.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const config = await response.json();
    resultContainer.innerHTML = getVerificationResultHTML(config);
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading configuration:', error);
    resultContainer.innerHTML = getNotFoundResultHTML(sha256Hash);
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function loadVerificationPage() {
  document.getElementById('page-container').innerHTML = getLandingPageHTML();
  setupLandingPageListeners();
}

function setupLandingPageListeners() {
  const uploadSection = document.getElementById('upload-section');
  const fileInput = document.getElementById('file-input');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (uploadSection) {
    uploadSection.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadSection.style.borderColor = 'var(--color-primary)';
      uploadSection.style.background = 'rgba(32, 33, 110, 0.08)';
    });

    uploadSection.addEventListener('dragleave', () => {
      uploadSection.style.borderColor = 'var(--color-border)';
      uploadSection.style.background = 'rgba(32, 33, 110, 0.02)';
    });

    uploadSection.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadSection.style.borderColor = 'var(--color-border)';
      uploadSection.style.background = 'rgba(32, 33, 110, 0.02)';

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', loadVerificationPage);
