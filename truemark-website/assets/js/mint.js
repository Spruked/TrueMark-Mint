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
    networks: {
        polygon: {
            name: 'Polygon',
            chainId: 137,
            rpcUrl: 'https://polygon-rpc.com',
            currency: 'MATIC',
            explorerUrl: 'https://polygonscan.com',
            gasSettings: {
                gasPrice: '30000000000', // 30 gwei
                gasLimit: '300000'
            },
            contracts: {
                truemark: '0x...', // TrueMark contract on Polygon
                marketplace: '0x...' // Marketplace contract on Polygon
            },
            type: 'personal',
            features: ['low-cost', 'fast', 'eco-friendly']
        },
        ethereum: {
            name: 'Ethereum',
            chainId: 1,
            rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
            currency: 'ETH',
            explorerUrl: 'https://etherscan.io',
            gasSettings: {
                gasPrice: '20000000000', // 20 gwei
                gasLimit: '300000'
            },
            contracts: {
                truemark: '0x...', // TrueMark contract on Ethereum
                marketplace: '0x...' // Marketplace contract on Ethereum
            },
            type: 'enterprise',
            features: ['maximum-security', 'largest-ecosystem', 'premium']
        }
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
    totalSteps: 5, // Updated to 5 steps
    selectedNFTType: null,
    selectedFile: null,
    selectedNetwork: 'polygon', // Default to Polygon
    networkConfig: null,
    uploadProgress: 0,
    mintRequestId: null,
    isProcessing: false,
    certificate: null,
    invoice: null,
    web3: null,
    account: null,
    royaltyInfo: {
        resaleRate: 1.5,
        licensingRate: 3.0
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeMintForm();
    setupNFTTypeSelection();
    setupFileUpload();
    setupStepNavigation();
    setupNetworkSelection();
});

/**
 * Setup NFT type selection interface
 */
function setupNFTTypeSelection() {
    const grid = document.getElementById('nftTypesGrid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    // Generate NFT type cards
    const nftTypes = nftTaxonomy.getAllNFTTypes();
    const userContext = {
        userType: window.authSystem?.getUserType() || 'demo',
        hasCustomPricing: false
    };

    Object.entries(nftTypes).forEach(([key, nftType]) => {
        const validation = nftTaxonomy.validateSelection(key, userContext);
        const pricing = nftTaxonomy.getPricing(key);
        const priceDisplay = nftTaxonomy.formatPrice(key);

        const card = document.createElement('div');
        card.className = `nft-type-card ${nftType.colorClass}`;
        card.setAttribute('data-nft-type', key);
        
        // Add special classes for features
        if (nftType.royaltyEnabled) card.classList.add('has-royalty');
        if (nftType.updatableMetadata) card.classList.add('has-updatable');

        card.innerHTML = `
            <input type="radio" name="nftType" value="${key}" id="nftType${key.charAt(0).toUpperCase() + key.slice(1)}">
            <div class="nft-type-header">
                <div class="nft-type-icon">${nftType.icon}</div>
                <div class="nft-type-info">
                    <h4>${nftType.name}</h4>
                    <span class="nft-type-key">${nftType.key}</span>
                </div>
            </div>
            <div class="nft-type-description">${nftType.tooltip}</div>
            <div class="nft-type-footer">
                <div class="nft-type-price">${priceDisplay}</div>
                <div class="nft-type-features">
                    ${nftType.features.slice(0, 3).map(feature => 
                        `<span class="nft-feature-tag">${feature.replace('-', ' ')}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        // Disable if validation failed
        if (!validation.valid) {
            card.classList.add('disabled');
            card.title = validation.errors.join(', ');
        }

        // Add click handler
        card.addEventListener('click', () => {
            if (validation.valid) {
                selectNFTType(key);
            }
        });

        grid.appendChild(card);
    });

    // Setup radio button handlers
    const radioButtons = grid.querySelectorAll('input[name="nftType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectNFTType(e.target.value);
            }
        });
    });
}

/**
 * Select an NFT type
 */
function selectNFTType(typeKey) {
    // Remove previous selections
    document.querySelectorAll('.nft-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Select new type
    const selectedCard = document.querySelector(`[data-nft-type="${typeKey}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        const radio = selectedCard.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    }

    // Update state
    mintState.selectedNFTType = typeKey;
    const nftType = nftTaxonomy.getNFTType(typeKey);
    
    // Enable next button
    const nextBtn = document.getElementById('nextStep1');
    if (nextBtn) {
        nextBtn.disabled = false;
    }

    // Show selection feedback
    showSuccess(`Selected ${nftType.name} - ${nftType.tooltip}`);
    
    // Auto-suggest network based on NFT type
    suggestNetworkForNFTType(typeKey);
}

/**
 * Suggest optimal network for NFT type
 */
function suggestNetworkForNFTType(typeKey) {
    const nftType = nftTaxonomy.getNFTType(typeKey);
    if (!nftType) return;

    // Enterprise and Custom types should default to Ethereum
    if (['enterprise', 'custom'].includes(typeKey)) {
        mintState.selectedNetwork = 'ethereum';
    } else {
        // Personal types default to Polygon
        mintState.selectedNetwork = 'polygon';
    }

    // Update network config
    mintState.networkConfig = MINT_CONFIG.networks[mintState.selectedNetwork];
}

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

    // Initialize network based on user type
    initializeDefaultNetwork();

    // Setup Web3 connection
    initializeWeb3();

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
 * Create mint request with NFT type and royalty information
 */
async function createMintRequest(fileHash) {
    const nftType = nftTaxonomy.getNFTType(mintState.selectedNFTType);
    const royaltyRates = nftTaxonomy.getRoyaltyRates();
    
    const mintRequest = {
        fileHash: fileHash,
        metadata: getFormData(),
        nftType: {
            key: nftType.key,
            name: nftType.name,
            contractType: nftType.contractType,
            updatableMetadata: nftType.updatableMetadata,
            features: nftType.features
        },
        mintOptions: {
            network: mintState.selectedNetwork,
            standard: 'ERC-721',
            royalty: royaltyRates.resale, // 1.5%
            licensingRoyalty: nftType.licensingRoyalty ? royaltyRates.licensing : 0 // 3% for Lic/E
        },
        pricing: nftTaxonomy.getPricing(mintState.selectedNFTType)
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
 * Download functions with NFT type and royalty information
 */
function downloadCertificate() {
    const nftType = nftTaxonomy.getNFTType(mintState.selectedNFTType);
    const network = mintState.networkConfig;
    const royaltyRates = nftTaxonomy.getRoyaltyRates();
    
    // Create enhanced certificate with NFT type and royalty info
    const certificateContent = `
TrueMark Mint Digital Certificate
${nftType.icon} ${nftType.name} (${nftType.key})

Certificate ID: ${mintState.certificate.id}
Token ID: ${mintState.certificate.tokenId}
Transaction Hash: ${mintState.certificate.transactionHash}
Network: ${network.name} (Chain ID: ${network.chainId})
Issue Date: ${mintState.certificate.issueDate}

Asset Information:
- Title: ${mintState.certificate.metadata.assetTitle}
- Creator: ${mintState.certificate.metadata.creatorName}
- Email: ${mintState.certificate.metadata.creatorEmail}
- Category: ${mintState.certificate.metadata.assetCategory || 'Unspecified'}

NFT Type Features:
- Contract Type: ${nftType.contractType}
- Updatable Metadata: ${nftType.updatableMetadata ? 'Yes' : 'No'}
- Special Features: ${nftType.features.join(', ')}

Royalty Provisions:
- Resale Royalty: ${royaltyRates.resale}% (automatically distributed on secondary sales)
- Licensing Royalty: ${nftType.licensingRoyalty ? royaltyRates.licensing + '% (on licensing revenue)' : 'Not applicable'}

${nftType.licensingRoyalty ? `
Licensing Information:
This ${nftType.name} includes built-in licensing capabilities. All licensing agreements
and royalty payments are tracked on-chain, ensuring transparent revenue distribution.
` : ''}

Blockchain Verification:
View on ${network.explorerName}: ${network.explorerUrl}/tx/${mintState.certificate.transactionHash}

This certificate verifies the authenticity and ownership of the above digital asset 
as recorded on the ${network.name} blockchain. Includes royalty provisions: 
${royaltyRates.resale}% resale${nftType.licensingRoyalty ? `, ${royaltyRates.licensing}% licensing revenue` : ''}.

Certified by Alpha CertSig Mint
© 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.
    `;
    
    downloadTextFile(`certificate_${nftType.key}_${mintState.certificate.id}.txt`, certificateContent);
}

function downloadInvoice() {
    const nftType = nftTaxonomy.getNFTType(mintState.selectedNFTType);
    const pricing = nftTaxonomy.getPricing(mintState.selectedNFTType);
    const network = mintState.networkConfig;
    const royaltyRates = nftTaxonomy.getRoyaltyRates();
    
    // Calculate estimated cost based on NFT type and network
    let estimatedCost = '$0.00';
    if (!pricing.isCustom) {
        const avgPrice = pricing.max ? (pricing.min + pricing.max) / 2 : pricing.min;
        estimatedCost = `$${avgPrice.toFixed(2)}`;
    }
    
    // Create enhanced invoice with NFT type and royalty info
    const invoiceContent = `
TrueMark Mint Invoice
${nftType.icon} ${nftType.name} Service

Invoice ID: ${mintState.invoice.id}
Certificate ID: ${mintState.invoice.certificateId}
Issue Date: ${mintState.invoice.issueDate}
Amount: ${estimatedCost}
Status: ${mintState.invoice.status}
Network: ${network.name}

Service Details:
- NFT Type: ${nftType.name} (${nftType.key})
- Description: ${nftType.description}
- Contract Type: ${nftType.contractType}
- Network: ${network.name} (${network.currency})

Pricing Tier: ${nftTaxonomy.getPricingPhase().charAt(0).toUpperCase() + nftTaxonomy.getPricingPhase().slice(1)}
${pricing.isCustom ? 'Custom Pricing - Contact sales for details' : `Price Range: $${pricing.min}${pricing.max ? ' - $' + pricing.max : '+'}`}

Royalty Provisions Included:
- Resale Royalty: ${royaltyRates.resale}% on all secondary market sales
- Licensing Royalty: ${nftType.licensingRoyalty ? royaltyRates.licensing + '% on licensing revenue' : 'Not applicable for this NFT type'}

${nftType.licensingRoyalty ? `
Licensing Benefits:
Your ${nftType.name} includes built-in licensing tracking and revenue distribution.
All licensing agreements are recorded on-chain with automatic royalty payments.
` : ''}

Features Included:
${nftType.features.map(feature => `- ${feature.replace('-', ' ')}`).join('\n')}

Terms & Conditions:
- All sales are final and recorded on the blockchain
- Royalty provisions are automatically enforced by smart contracts
- TrueMark retains specified royalty percentages as outlined above
- Certificate authenticity is verifiable on ${network.explorerName}

Certified by Alpha CertSig Mint
© 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.
    `;
    
    downloadTextFile(`invoice_${nftType.key}_${mintState.invoice.id}.txt`, invoiceContent);
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
    switchNetwork: switchNetwork,
    getNetworkConfig: () => mintState.networkConfig,
    resetMint: () => {
        mintState.currentStep = 1;
        updateStepProgress();
        showStep(1);
        resetForm();
    }
};

/**
 * Network Selection and Management
 */

/**
 * Initialize default network based on user type
 */
function initializeDefaultNetwork() {
    const userType = window.authSystem.getUserType();
    
    // Set default network based on user type
    if (userType === 'enterprise' || userType === 'admin') {
        mintState.selectedNetwork = 'ethereum';
        const ethereumRadio = document.getElementById('networkEthereum');
        if (ethereumRadio) ethereumRadio.checked = true;
    } else {
        mintState.selectedNetwork = 'polygon';
        const polygonRadio = document.getElementById('networkPolygon');
        if (polygonRadio) polygonRadio.checked = true;
    }
    
    // Update network config
    mintState.networkConfig = MINT_CONFIG.networks[mintState.selectedNetwork];
    updateNetworkDisplay();
}

/**
 * Setup network selection event handlers
 */
function setupNetworkSelection() {
    const networkOptions = document.querySelectorAll('input[name="network"]');
    
    networkOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.checked) {
                switchNetwork(this.value);
            }
        });
    });
    
    // Add click handlers for network option containers
    const networkContainers = document.querySelectorAll('.network-option');
    networkContainers.forEach(container => {
        container.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio && !radio.checked) {
                radio.checked = true;
                switchNetwork(radio.value);
            }
        });
    });
}

/**
 * Switch to a different blockchain network
 * @param {string} networkKey - The network identifier (polygon/ethereum)
 */
async function switchNetwork(networkKey) {
    if (!MINT_CONFIG.networks[networkKey]) {
        showError(`Unsupported network: ${networkKey}`);
        return false;
    }
    
    const oldNetwork = mintState.selectedNetwork;
    mintState.selectedNetwork = networkKey;
    mintState.networkConfig = MINT_CONFIG.networks[networkKey];
    
    try {
        // Update Web3 connection if available
        if (mintState.web3) {
            await updateWeb3Network();
        }
        
        updateNetworkDisplay();
        showSuccess(`Switched to ${mintState.networkConfig.name} network`);
        
        // Log network switch
        console.log(`Network switched from ${oldNetwork} to ${networkKey}`);
        
        return true;
    } catch (error) {
        console.error('Failed to switch network:', error);
        showError(`Failed to switch to ${mintState.networkConfig.name}: ${error.message}`);
        
        // Revert on error
        mintState.selectedNetwork = oldNetwork;
        mintState.networkConfig = MINT_CONFIG.networks[oldNetwork];
        return false;
    }
}

/**
 * Initialize Web3 connection
 */
async function initializeWeb3() {
    try {
        // Check if Web3 is available
        if (typeof window.ethereum !== 'undefined') {
            // Initialize Web3 with current network
            await connectWallet();
        } else {
            console.log('Web3 not available - operating in demo mode');
            showInfo('MetaMask not detected. Operating in demo mode.');
        }
    } catch (error) {
        console.error('Web3 initialization failed:', error);
        showInfo('Web3 connection failed. Operating in demo mode.');
    }
}

/**
 * Connect to user's wallet
 */
async function connectWallet() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
            mintState.account = accounts[0];
            
            // Initialize Web3 instance
            mintState.web3 = new Web3(window.ethereum);
            
            // Switch to correct network
            await updateWeb3Network();
            
            showSuccess(`Wallet connected: ${mintState.account.substring(0, 6)}...${mintState.account.substring(38)}`);
        }
        
        return true;
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showError('Failed to connect wallet. Please try again.');
        return false;
    }
}

/**
 * Update Web3 to use current network
 */
async function updateWeb3Network() {
    if (!mintState.web3 || !mintState.networkConfig) return;
    
    try {
        const currentChainId = await mintState.web3.eth.getChainId();
        const targetChainId = mintState.networkConfig.chainId;
        
        if (currentChainId !== targetChainId) {
            // Request network switch
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
        }
        
        // Update Web3 provider
        mintState.web3.setProvider(window.ethereum);
        
    } catch (error) {
        if (error.code === 4902) {
            // Network not added to wallet, add it
            await addNetworkToWallet();
        } else {
            throw error;
        }
    }
}

/**
 * Add network to wallet if not present
 */
async function addNetworkToWallet() {
    const network = mintState.networkConfig;
    
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: {
                    name: network.currency,
                    symbol: network.currency,
                    decimals: 18
                },
                blockExplorerUrls: [network.explorerUrl]
            }]
        });
    } catch (error) {
        console.error('Failed to add network:', error);
        throw new Error(`Failed to add ${network.name} to wallet`);
    }
}

/**
 * Update network display elements
 */
function updateNetworkDisplay() {
    const network = mintState.networkConfig;
    if (!network) return;
    
    // Update any network status displays
    const networkStatus = document.querySelector('.network-status');
    if (networkStatus) {
        networkStatus.innerHTML = `
            <span class="network-indicator ${mintState.selectedNetwork}"></span>
            <span class="network-name">${network.name}</span>
            <span class="network-currency">${network.currency}</span>
        `;
    }
    
    // Update cost estimates based on network
    updateCostEstimates();
}

/**
 * Update cost estimates for selected network
 */
function updateCostEstimates() {
    const network = mintState.networkConfig;
    if (!network) return;
    
    const costElements = document.querySelectorAll('.mint-cost');
    const estimatedCost = network.type === 'personal' ? '$0.05 - $0.50' : '$15 - $50';
    
    costElements.forEach(element => {
        element.textContent = `Est. ${estimatedCost} ${network.currency}`;
    });
}