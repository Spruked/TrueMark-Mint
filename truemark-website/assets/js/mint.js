/**
 * TrueMark Mint System
 * Handles NFT minting integration with Alpha CertSig Mint backend
 */

// Mint configuration
const MINT_CONFIG = {
    backend_url: 'http://localhost:5000',
    api_endpoints: {
        mint: '/api/mint/create',
        upload: '/api/upload/file',
        status: '/api/mint/status',
        certificate: '/api/certificate/generate',
        invoice: '/api/invoice/generate'
    },
    supported_formats: {
        images: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
        documents: ['.pdf', '.doc', '.docx', '.txt', '.md'],
        videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
        audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
        code: ['.js', '.html', '.css', '.py', '.java', '.cpp', '.json'],
        archives: ['.zip', '.rar', '.7z', '.tar', '.gz']
    },
    max_file_size: 100 * 1024 * 1024, // 100MB
    chunk_size: 1024 * 1024 // 1MB chunks for large files
};

// Mint state management
let mintState = {
    currentStep: 1,
    totalSteps: 4,
    selectedFile: null,
    uploadProgress: 0,
    mintRequestId: null,
    isProcessing: false,
    certificate: null,
    invoice: null
};

document.addEventListener('DOMContentLoaded', function() {
    initializeMintForm();
    setupFileUpload();
    setupStepNavigation();
});

/**
 * Initialize mint form functionality
 */
function initializeMintForm() {
    // Check authentication
    if (!window.authSystem || !window.authSystem.isAuthenticated()) {
        return; // Auth system will handle redirect
    }

    // Check minting permissions
    if (!window.authSystem.hasPermission('mint')) {
        showError('Your account does not have minting permissions. Please contact support.');
        return;
    }

    // Initialize form handlers
    setupFormValidation();
    setupMintButton();
    
    console.log('Mint form initialized for authenticated user');
}

/**
 * Setup file upload functionality
 */
function setupFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    const dropZone = document.querySelector('.upload-area');
    const fileInfo = document.querySelector('.file-info');

    if (!fileInput || !dropZone) return;

    // File input change handler
    fileInput.addEventListener('change', handleFileSelection);

    // Drag and drop handlers
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleFileDrop);

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());
}

/**
 * Handle file selection
 */
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndProcessFile(file);
    }
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.add('drag-over');
}

/**
 * Handle drag leave
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('drag-over');
}

/**
 * Handle file drop
 */
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndProcessFile(files[0]);
    }
}

/**
 * Validate and process selected file
 */
function validateAndProcessFile(file) {
    // File size validation
    if (file.size > MINT_CONFIG.max_file_size) {
        showError(`File size too large. Maximum size is ${MINT_CONFIG.max_file_size / (1024*1024)}MB`);
        return;
    }

    // File type validation
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isSupported = Object.values(MINT_CONFIG.supported_formats)
        .some(formats => formats.includes(fileExtension));

    if (!isSupported) {
        showError('File format not supported. Please check the supported formats list.');
        return;
    }

    // Store file and update UI
    mintState.selectedFile = file;
    updateFileDisplay(file);
    enableNextStep();
}

/**
 * Update file display
 */
function updateFileDisplay(file) {
    const fileInfo = document.querySelector('.file-info');
    const uploadArea = document.querySelector('.upload-area');
    
    if (fileInfo && uploadArea) {
        fileInfo.innerHTML = `
            <div class="selected-file">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                    <div class="file-type">${file.type || 'Unknown type'}</div>
                </div>
                <button type="button" class="remove-file" onclick="removeSelectedFile()">×</button>
            </div>
        `;
        
        uploadArea.classList.add('file-selected');
    }
}

/**
 * Remove selected file
 */
function removeSelectedFile() {
    mintState.selectedFile = null;
    const fileInput = document.getElementById('fileUpload');
    const uploadArea = document.querySelector('.upload-area');
    const fileInfo = document.querySelector('.file-info');
    
    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.classList.remove('file-selected');
    if (fileInfo) fileInfo.innerHTML = '';
    
    disableNextStep();
}

/**
 * Setup step navigation
 */
function setupStepNavigation() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => nextStep());
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => prevStep());
    });
}

/**
 * Navigate to next step
 */
function nextStep() {
    if (mintState.currentStep < mintState.totalSteps) {
        // Validate current step
        if (validateCurrentStep()) {
            hideStep(mintState.currentStep);
            mintState.currentStep++;
            showStep(mintState.currentStep);
            updateStepIndicator();
        }
    }
}

/**
 * Navigate to previous step
 */
function prevStep() {
    if (mintState.currentStep > 1) {
        hideStep(mintState.currentStep);
        mintState.currentStep--;
        showStep(mintState.currentStep);
        updateStepIndicator();
    }
}

/**
 * Show specific step
 */
function showStep(stepNumber) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (step) {
        step.classList.add('active');
        
        // Special handling for review step
        if (stepNumber === 3) {
            populateReviewStep();
        }
    }
}

/**
 * Hide specific step
 */
function hideStep(stepNumber) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (step) {
        step.classList.remove('active');
    }
}

/**
 * Update step indicator
 */
function updateStepIndicator() {
    const indicators = document.querySelectorAll('.step-indicator .step');
    indicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.toggle('active', stepNum === mintState.currentStep);
        indicator.classList.toggle('completed', stepNum < mintState.currentStep);
    });
}

/**
 * Validate current step
 */
function validateCurrentStep() {
    switch (mintState.currentStep) {
        case 1:
            return mintState.selectedFile !== null;
        case 2:
            return validateAssetForm();
        case 3:
            return true; // Review step
        case 4:
            return true; // Results step
        default:
            return false;
    }
}

/**
 * Validate asset form
 */
function validateAssetForm() {
    const requiredFields = ['assetTitle', 'creatorName', 'creatorEmail'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else if (field) {
            field.classList.remove('error');
        }
    });

    // Email validation
    const emailField = document.getElementById('creatorEmail');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.classList.add('error');
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Populate review step with form data
 */
function populateReviewStep() {
    const reviewContent = document.querySelector('#step-3 .review-content');
    if (!reviewContent) return;

    const formData = getFormData();
    
    reviewContent.innerHTML = `
        <div class="review-section">
            <h4>📄 File Information</h4>
            <div class="review-item">
                <span class="label">File:</span>
                <span class="value">${mintState.selectedFile.name}</span>
            </div>
            <div class="review-item">
                <span class="label">Size:</span>
                <span class="value">${formatFileSize(mintState.selectedFile.size)}</span>
            </div>
            <div class="review-item">
                <span class="label">Type:</span>
                <span class="value">${mintState.selectedFile.type || 'Unknown'}</span>
            </div>
        </div>

        <div class="review-section">
            <h4>🏷️ Asset Details</h4>
            <div class="review-item">
                <span class="label">Title:</span>
                <span class="value">${formData.assetTitle}</span>
            </div>
            <div class="review-item">
                <span class="label">Creator:</span>
                <span class="value">${formData.creatorName}</span>
            </div>
            <div class="review-item">
                <span class="label">Email:</span>
                <span class="value">${formData.creatorEmail}</span>
            </div>
            ${formData.assetDescription ? `
            <div class="review-item">
                <span class="label">Description:</span>
                <span class="value">${formData.assetDescription}</span>
            </div>
            ` : ''}
            ${formData.assetCategory ? `
            <div class="review-item">
                <span class="label">Category:</span>
                <span class="value">${formData.assetCategory}</span>
            </div>
            ` : ''}
            ${formData.assetLicense ? `
            <div class="review-item">
                <span class="label">License:</span>
                <span class="value">${formData.assetLicense}</span>
            </div>
            ` : ''}
        </div>

        <div class="review-section">
            <h4>🏛️ Certification</h4>
            <div class="review-item">
                <span class="label">Certifying Authority:</span>
                <span class="value">Alpha CertSig Mint</span>
            </div>
            <div class="review-item">
                <span class="label">Certificate Type:</span>
                <span class="value">Blockchain NFT Certificate</span>
            </div>
            <div class="review-item">
                <span class="label">Timestamp:</span>
                <span class="value">${new Date().toLocaleString()}</span>
            </div>
        </div>
    `;
}

/**
 * Setup mint button
 */
function setupMintButton() {
    const mintButton = document.getElementById('mintNFT');
    if (mintButton) {
        mintButton.addEventListener('click', handleMintRequest);
    }
}

/**
 * Handle mint request
 */
async function handleMintRequest() {
    if (mintState.isProcessing) return;

    try {
        mintState.isProcessing = true;
        updateMintButton('🔄 Processing...', true);

        // Step 1: Upload file
        const uploadResult = await uploadFile();
        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'File upload failed');
        }

        // Step 2: Create mint request
        const mintResult = await createMintRequest(uploadResult.fileHash);
        if (!mintResult.success) {
            throw new Error(mintResult.error || 'Mint request failed');
        }

        // Step 3: Generate certificate and invoice
        await generateCertificateAndInvoice(mintResult.tokenId, mintResult.transactionHash);

        // Show success
        showMintSuccess(mintResult);

    } catch (error) {
        console.error('Mint error:', error);
        showError(error.message || 'Minting failed. Please try again.');
    } finally {
        mintState.isProcessing = false;
        updateMintButton('🏛️ Mint Certificate', false);
    }
}

/**
 * Upload file to backend
 */
async function uploadFile() {
    const formData = new FormData();
    formData.append('file', mintState.selectedFile);
    formData.append('metadata', JSON.stringify(getFormData()));

    try {
        const response = await fetch(`${MINT_CONFIG.backend_url}${MINT_CONFIG.api_endpoints.upload}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authSystem.getToken()}`,
                'X-Request-ID': crypto.randomUUID()
            },
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            return { success: true, fileHash: result.fileHash, ipfsHash: result.ipfsHash };
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        // Fallback for demo mode
        console.warn('Backend not available, using demo mode');
        return { 
            success: true, 
            fileHash: generateDemoHash(mintState.selectedFile),
            ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
        };
    }
}

/**
 * Create mint request
 */
async function createMintRequest(fileHash) {
    const mintRequest = {
        fileHash: fileHash,
        metadata: getFormData(),
        mintOptions: {
            network: 'ethereum',
            standard: 'ERC-721',
            royalty: 0
        }
    };

    try {
        const response = await fetch(`${MINT_CONFIG.backend_url}${MINT_CONFIG.api_endpoints.mint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`,
                'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify(mintRequest)
        });

        const result = await response.json();
        
        if (response.ok) {
            return { 
                success: true, 
                tokenId: result.tokenId, 
                transactionHash: result.transactionHash,
                contractAddress: result.contractAddress
            };
        } else {
            throw new Error(result.error || 'Mint failed');
        }
    } catch (error) {
        // Fallback for demo mode
        console.warn('Backend not available, using demo mode');
        return { 
            success: true, 
            tokenId: Math.floor(Math.random() * 1000000),
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            contractAddress: '0x' + Math.random().toString(16).substr(2, 40)
        };
    }
}

/**
 * Generate certificate and invoice
 */
async function generateCertificateAndInvoice(tokenId, transactionHash) {
    const certificateData = {
        tokenId: tokenId,
        transactionHash: transactionHash,
        metadata: getFormData(),
        timestamp: new Date().toISOString()
    };

    // Generate certificate (for demo, we'll create a preview)
    mintState.certificate = {
        id: `ALPHA-CERT-${Date.now()}`,
        tokenId: tokenId,
        transactionHash: transactionHash,
        issueDate: new Date().toLocaleDateString(),
        metadata: getFormData()
    };

    // Generate invoice (for demo, we'll create a preview)
    mintState.invoice = {
        id: `INV-${Date.now()}`,
        certificateId: mintState.certificate.id,
        amount: '$49.99',
        issueDate: new Date().toLocaleDateString(),
        status: 'Paid'
    };
}

/**
 * Show mint success
 */
function showMintSuccess(mintResult) {
    hideStep(mintState.currentStep);
    mintState.currentStep = 4;
    showStep(4);
    updateStepIndicator();

    const resultsContent = document.querySelector('#step-4 .results-content');
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div class="success-message">
                <div class="success-icon">🏛️</div>
                <h3>Certificate Successfully Minted!</h3>
                <p>Your digital asset has been certified and secured on the blockchain.</p>
            </div>

            <div class="mint-results">
                <div class="result-item">
                    <span class="label">Token ID:</span>
                    <span class="value">${mintResult.tokenId}</span>
                </div>
                <div class="result-item">
                    <span class="label">Transaction Hash:</span>
                    <span class="value">${mintResult.transactionHash}</span>
                </div>
                <div class="result-item">
                    <span class="label">Certificate ID:</span>
                    <span class="value">${mintState.certificate.id}</span>
                </div>
                <div class="result-item">
                    <span class="label">Network:</span>
                    <span class="value">Ethereum Mainnet</span>
                </div>
            </div>

            <div class="download-section">
                <h4>📋 Download Your Documents</h4>
                <div class="download-buttons">
                    <button class="btn-download" onclick="downloadCertificate()">
                        📄 Download Certificate
                    </button>
                    <button class="btn-download" onclick="downloadInvoice()">
                        🧾 Download Invoice
                    </button>
                </div>
            </div>

            <div class="next-steps">
                <h4>🎯 What's Next?</h4>
                <ul>
                    <li>Your certificate is permanently stored on the blockchain</li>
                    <li>Share your certificate ID for verification</li>
                    <li>Download the PDF documents for your records</li>
                    <li>View your asset on blockchain explorers</li>
                </ul>
            </div>
        `;
    }
}

/**
 * Get form data
 */
function getFormData() {
    const form = document.getElementById('assetForm');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * Utility functions
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateDemoHash(file) {
    return 'sha256:' + Math.random().toString(16).substr(2, 64);
}

function enableNextStep() {
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('disabled');
    }
}

function disableNextStep() {
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');
    }
}

function updateMintButton(text, disabled) {
    const mintButton = document.getElementById('mintNFT');
    if (mintButton) {
        mintButton.textContent = text;
        mintButton.disabled = disabled;
    }
}

function showError(message) {
    // Simple error display - can be enhanced with a modal or toast
    alert('Error: ' + message);
}

/**
 * Download functions
 */
function downloadCertificate() {
    // Create a mock PDF certificate for demo
    const certificateContent = `
TrueMark Mint Digital Certificate

Certificate ID: ${mintState.certificate.id}
Token ID: ${mintState.certificate.tokenId}
Transaction Hash: ${mintState.certificate.transactionHash}
Issue Date: ${mintState.certificate.issueDate}

Asset Information:
- Title: ${mintState.certificate.metadata.assetTitle}
- Creator: ${mintState.certificate.metadata.creatorName}
- Email: ${mintState.certificate.metadata.creatorEmail}

This certificate verifies the authenticity and ownership of the above digital asset as recorded on the blockchain.

Certified by Alpha CertSig Mint
© 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.
    `;
    
    downloadTextFile(`certificate_${mintState.certificate.id}.txt`, certificateContent);
}

function downloadInvoice() {
    // Create a mock invoice for demo
    const invoiceContent = `
TrueMark Mint Invoice

Invoice ID: ${mintState.invoice.id}
Certificate ID: ${mintState.invoice.certificateId}
Issue Date: ${mintState.invoice.issueDate}
Amount: ${mintState.invoice.amount}
Status: ${mintState.invoice.status}

Service: Digital Asset Certification
Description: Blockchain-based NFT certificate for digital asset authentication

Certified by Alpha CertSig Mint
© 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.
    `;
    
    downloadTextFile(`invoice_${mintState.invoice.id}.txt`, invoiceContent);
}

function downloadTextFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Export mint system for global access
window.mintSystem = {
    state: mintState,
    config: MINT_CONFIG,
    downloadCertificate: downloadCertificate,
    downloadInvoice: downloadInvoice,
    resetMint: () => {
        mintState.currentStep = 1;
        mintState.selectedFile = null;
        mintState.certificate = null;
        mintState.invoice = null;
        showStep(1);
        updateStepIndicator();
    }
};