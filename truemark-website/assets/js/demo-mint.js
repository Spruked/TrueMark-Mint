/**
 * TrueMark Demo Mint System
 * Generates authentic-looking certificates that match real NFT format
 */

// Demo mint state management
let demoMintState = {
    currentStep: 1,
    totalSteps: 5,
    selectedNFTType: 'standard',
    selectedNetwork: 'polygon',
    certificate: null,
    formData: {}
};

// NFT Types for demo (same as real system)
const demoNftTypes = {
    standard: {
        name: 'Standard Certificate',
        key: 'standard',
        colorClass: 'standard',
        icon: '📄',
        tooltip: 'Basic digital certificate with blockchain verification',
        features: ['blockchain-verification', 'digital-signature', 'tamper-proof'],
        royaltyEnabled: false,
        updatableMetadata: false,
        contractType: 'ERC-721',
        licensingRoyalty: 0
    },
    premium: {
        name: 'Premium Heritage',
        key: 'premium',
        colorClass: 'premium',
        icon: '🏛️',
        tooltip: 'Enhanced certificate with heritage features and premium verification',
        features: ['blockchain-verification', 'digital-signature', 'tamper-proof', 'heritage-proof', 'multi-signature'],
        royaltyEnabled: true,
        updatableMetadata: false,
        contractType: 'ERC-721',
        licensingRoyalty: 3.0
    },
    enterprise: {
        name: 'Enterprise Grade',
        key: 'enterprise',
        colorClass: 'enterprise',
        icon: '🏢',
        tooltip: 'Enterprise-level certificate with advanced security and compliance features',
        features: ['blockchain-verification', 'digital-signature', 'tamper-proof', 'enterprise-security', 'audit-trail', 'compliance-ready'],
        royaltyEnabled: true,
        updatableMetadata: true,
        contractType: 'ERC-721',
        licensingRoyalty: 5.0
    },
    kep_nft: {
        name: 'KEP-NFT Certificate',
        key: 'kep_nft',
        colorClass: 'kep-nft',
        icon: '🎓',
        tooltip: 'Knowledge & Expertise Preservation NFT with legal-grade US title-style documentation',
        features: ['blockchain-verification', 'us-title-back', 'web3-domain', 'encrypted-backup', 'color-coded', 'notary-ready'],
        royaltyEnabled: true,
        updatableMetadata: false,
        contractType: 'ERC-721',
        licensingRoyalty: 3.0,
        kepCategory: 'Knowledge'  // Default category
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDemoMint();
    setupDemoNFTTypeSelection();
});

/**
 * Initialize demo mint functionality
 */
function initializeDemoMint() {
    // Start with step 1
    showDemoStep(1);
    updateDemoStepIndicator();
}

/**
 * Setup NFT type selection for demo
 */
function setupDemoNFTTypeSelection() {
    const grid = document.getElementById('demoNftTypesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(demoNftTypes).forEach(([key, nftType]) => {
        const card = document.createElement('div');
        card.className = `nft-type-card ${nftType.colorClass}`;
        card.setAttribute('data-nft-type', key);

        if (nftType.royaltyEnabled) card.classList.add('has-royalty');
        if (nftType.updatableMetadata) card.classList.add('has-updatable');

        card.innerHTML = `
            <input type="radio" name="demoNftType" value="${key}" id="demoNftType${key.charAt(0).toUpperCase() + key.slice(1)}" ${key === 'standard' ? 'checked' : ''}>
            <div class="nft-type-header">
                <div class="nft-type-icon">${nftType.icon}</div>
                <div class="nft-type-info">
                    <h4>${nftType.name}</h4>
                    <span class="nft-type-key">${nftType.key}</span>
                </div>
            </div>
            <div class="nft-type-description">${nftType.tooltip}</div>
            <div class="nft-type-footer">
                <div class="nft-type-features">
                    ${nftType.features.slice(0, 3).map(feature =>
                        `<span class="nft-feature-tag">${feature.replace('-', ' ')}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        card.addEventListener('click', function() {
            const radio = card.querySelector('input[type="radio"]');
            radio.checked = true;
            demoMintState.selectedNFTType = key;
        });

        grid.appendChild(card);
    });
}

/**
 * Navigate to next demo step
 */
function nextDemoStep() {
    if (demoMintState.currentStep < demoMintState.totalSteps) {
        // Validate current step
        if (!validateDemoStep(demoMintState.currentStep)) {
            return;
        }

        // Save form data
        saveDemoFormData(demoMintState.currentStep);

        demoMintState.currentStep++;
        showDemoStep(demoMintState.currentStep);
        updateDemoStepIndicator();
    }
}

/**
 * Navigate to previous demo step
 */
function prevDemoStep() {
    if (demoMintState.currentStep > 1) {
        demoMintState.currentStep--;
        showDemoStep(demoMintState.currentStep);
        updateDemoStepIndicator();
    }
}

/**
 * Show specific demo step
 */
function showDemoStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`demo-step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Special handling for review step
    if (stepNumber === 4) {
        populateDemoReview();
    }
}

/**
 * Update demo step indicator
 */
function updateDemoStepIndicator() {
    // Could add visual step indicators here if needed
    console.log(`Demo Step: ${demoMintState.currentStep}/${demoMintState.totalSteps}`);
}

/**
 * Validate demo step
 */
function validateDemoStep(stepNumber) {
    switch (stepNumber) {
        case 1:
            const title = document.getElementById('demoAssetTitle').value.trim();
            const description = document.getElementById('demoAssetDescription').value.trim();
            const creator = document.getElementById('demoAssetCreator').value.trim();
            const date = document.getElementById('demoAssetDate').value;

            if (!title || !description || !creator || !date) {
                alert('Please fill in all required fields.');
                return false;
            }
            return true;

        case 2:
            const selectedType = document.querySelector('input[name="demoNftType"]:checked');
            if (!selectedType) {
                alert('Please select an NFT type.');
                return false;
            }
            demoMintState.selectedNFTType = selectedType.value;
            return true;

        case 3:
            const selectedNetwork = document.querySelector('input[name="network"]:checked');
            if (!selectedNetwork) {
                alert('Please select a network.');
                return false;
            }
            demoMintState.selectedNetwork = selectedNetwork.value;
            return true;

        default:
            return true;
    }
}

/**
 * Save demo form data
 */
function saveDemoFormData(stepNumber) {
    const form = document.getElementById('demoMintForm');
    if (!form) return;

    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        demoMintState.formData[key] = value;
    }
}

/**
 * Populate demo review section
 */
function populateDemoReview() {
    const reviewSection = document.getElementById('demoReviewSection');
    if (!reviewSection) return;

    const nftType = demoNftTypes[demoMintState.selectedNFTType];
    const network = demoMintState.selectedNetwork === 'polygon' ? 'Polygon' : 'Ethereum';

    reviewSection.innerHTML = `
        <div class="review-section">
            <h4>📄 Asset Information</h4>
            <div class="review-item">
                <span class="label">Title:</span>
                <span class="value">${demoMintState.formData.title || 'N/A'}</span>
            </div>
            <div class="review-item">
                <span class="label">Description:</span>
                <span class="value">${demoMintState.formData.description || 'N/A'}</span>
            </div>
            <div class="review-item">
                <span class="label">Creator:</span>
                <span class="value">${demoMintState.formData.creator || 'N/A'}</span>
            </div>
            <div class="review-item">
                <span class="label">Creation Date:</span>
                <span class="value">${demoMintState.formData.creationDate || 'N/A'}</span>
            </div>
        </div>

        <div class="review-section">
            <h4>🏷️ Certificate Type</h4>
            <div class="review-item">
                <span class="label">Type:</span>
                <span class="value">${nftType.name}</span>
            </div>
            <div class="review-item">
                <span class="label">Features:</span>
                <span class="value">${nftType.features.join(', ')}</span>
            </div>
            <div class="review-item">
                <span class="label">Contract Type:</span>
                <span class="value">${nftType.contractType}</span>
            </div>
        </div>

        <div class="review-section">
            <h4>🌐 Blockchain Network</h4>
            <div class="review-item">
                <span class="label">Network:</span>
                <span class="value">${network}</span>
            </div>
            <div class="review-item">
                <span class="label">Estimated Cost:</span>
                <span class="value">$49.99 (Demo)</span>
            </div>
        </div>
    `;
}

/**
 * Generate demo certificate
 */
function generateDemoCertificate() {
    const mintBtn = document.getElementById('demoMintBtn');
    const mintText = mintBtn.querySelector('.mint-text');
    const loadingText = mintBtn.querySelector('.loading-text');

    // Update button state
    mintBtn.disabled = true;
    mintText.style.display = 'none';
    loadingText.style.display = 'inline';

    // Simulate processing time
    setTimeout(() => {
        // Generate realistic certificate data
        const certificateData = generateRealisticCertificateData();

        // Store certificate data
        demoMintState.certificate = certificateData;

        // Display certificate
        displayDemoCertificate(certificateData);

        // Move to final step
        demoMintState.currentStep = 5;
        showDemoStep(5);

        // Reset button
        mintBtn.disabled = false;
        mintText.style.display = 'inline';
        loadingText.style.display = 'none';

    }, 2000); // 2 second delay to simulate processing
}

/**
 * Generate realistic certificate data that matches real NFT format
 */
function generateRealisticCertificateData() {
    const timestamp = new Date();
    const tokenId = Math.floor(Math.random() * 1000000);
    const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);

    // Check if this is a KEP-NFT certificate
    if (demoMintState.selectedNFTType === 'kep_nft') {
        const kepCategories = ['Knowledge', 'Expertise', 'Preservation', 'Hybrid'];
        const kepCategory = demoMintState.formData.kepCategory || kepCategories[Math.floor(Math.random() * kepCategories.length)];

        return {
            serial_number: `DALSM${String(Date.now()).slice(-4)}`,
            token_id: tokenId,
            transaction_hash: transactionHash,
            issuer_web3_domain: `${demoMintState.formData.creator.toLowerCase().replace(/\s+/g, '')}.kep`,
            caleon_verification: `HASH_OF_CONTENT+SIGNATURE_${Date.now()}`,
            wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            stardate: `${new Date().getFullYear() - 1600}.${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
            iso_timestamp: timestamp.toISOString(),
            metadata_url: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substr(2, 44)}`,
            project: demoMintState.formData.title,
            category: kepCategory,
            owner: demoMintState.formData.creator,
            web3_domain: `${demoMintState.formData.creator.toLowerCase().replace(/\s+/g, '')}.kep`,
            certificate_type: 'KEP-NFT',
            json_metadata: JSON.stringify({
                name: `KEP-NFT Certificate ${demoMintState.formData.title}`,
                description: `Knowledge & Expertise Preservation Certificate for ${demoMintState.formData.title}. Category: ${kepCategory}. Owner: ${demoMintState.formData.creator}. Web3 Domain: ${demoMintState.formData.creator.toLowerCase().replace(/\s+/g, '')}.kep.`,
                creator: demoMintState.formData.creator,
                creationDate: demoMintState.formData.creationDate,
                certificateType: 'KEP-NFT',
                category: kepCategory,
                project: demoMintState.formData.title,
                network: demoMintState.selectedNetwork,
                issuer: 'truemark.x',
                verified: true,
                attributes: [
                    { trait_type: 'Category', value: kepCategory },
                    { trait_type: 'Project', value: demoMintState.formData.title },
                    { trait_type: 'Web3 Domain', value: `${demoMintState.formData.creator.toLowerCase().replace(/\s+/g, '')}.kep` },
                    { trait_type: 'Royalties - Licensing', value: 3, display_type: 'number' },
                    { trait_type: 'Royalties - Sale', value: 5, display_type: 'number' }
                ]
            }, null, 2)
        };
    }

    // Standard certificate generation
    return {
        serial_number: `LNFT-2025-TRM-${String(tokenId).padStart(6, '0')}-A9F2`,
        token_id: tokenId,
        transaction_hash: transactionHash,
        issuer_web3_domain: 'truemark.x',
        caleon_verification: `HASH_OF_CONTENT+SIGNATURE_${Date.now()}`,
        wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        stardate: `9530.${Math.floor(Math.random() * 9999)}`,
        iso_timestamp: timestamp.toISOString(),
        metadata_url: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substr(2, 44)}`,
        json_metadata: JSON.stringify({
            name: demoMintState.formData.title,
            description: demoMintState.formData.description,
            creator: demoMintState.formData.creator,
            creationDate: demoMintState.formData.creationDate,
            certificateType: demoMintState.selectedNFTType,
            network: demoMintState.selectedNetwork,
            issuer: 'truemark.x',
            verified: true
        }, null, 2)
    };
}

/**
 * Display demo certificate
 */
function displayDemoCertificate(certificateData) {
    const preview = document.getElementById('certificatePreview');
    if (!preview) return;

    // Check if this is a KEP-NFT certificate
    const isKEP = certificateData.certificate_type === 'KEP-NFT';

    const headerTitle = isKEP ? 'KEP-NFT Certificate' : 'TrueMark Certificate';
    const headerSubtitle = isKEP ? 'Knowledge & Expertise Preservation' : 'Digital Asset Certification & Blockchain Minting';
    const sealIcon = isKEP ? '🎓' : '🏛️';

    let additionalDetails = '';
    if (isKEP) {
        additionalDetails = `
                <div class="detail-item">
                    <span class="detail-label">Project:</span>
                    <span class="detail-value">${certificateData.project}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${certificateData.category}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Owner:</span>
                    <span class="detail-value">${certificateData.owner}</span>
                </div>
        `;
    }

    preview.innerHTML = `
        <div class="certificate-header">
            <h2>${headerTitle}</h2>
            <p>${headerSubtitle}</p>
        </div>

        <div class="certificate-content">
            <!-- TrueMark Seal -->
            <div class="truemark-seal-demo">
                ${sealIcon}
            </div>

            <div class="certificate-details">
                <div class="detail-item">
                    <span class="detail-label">Serial Number:</span>
                    <span class="detail-value">${certificateData.serial_number}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Web3 Domain:</span>
                    <span class="detail-value">${certificateData.issuer_web3_domain}</span>
                </div>

                ${additionalDetails}

                <div class="detail-item">
                    <span class="detail-label">NFT Token ID:</span>
                    <span class="detail-value">${certificateData.token_id}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Blockchain Transaction:</span>
                    <span class="detail-value">${certificateData.transaction_hash}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Timestamp (ISS Stardate):</span>
                    <span class="detail-value">${certificateData.stardate}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">ISO Timestamp:</span>
                    <span class="detail-value">${certificateData.iso_timestamp}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Caleon Verification:</span>
                    <span class="detail-value">${certificateData.caleon_verification}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Owner Wallet:</span>
                    <span class="detail-value">${certificateData.wallet}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Metadata URL:</span>
                    <span class="detail-value">${certificateData.metadata_url}</span>
                </div>
            </div>

            <!-- QR Code Placeholder -->
            <div style="grid-column: 2; text-align: center; margin-top: 2rem;">
                <div class="qr-placeholder">
                    QR Code<br>Verification
                </div>
                <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                    Scan to verify authenticity on blockchain
                </p>
            </div>
        </div>

        <!-- Certificate Metadata -->
        <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h4 style="margin-bottom: 1rem; color: #2c3e50;">Certificate Metadata (JSON)</h4>
            <pre style="font-size: 0.8rem; color: #495057; overflow-x: auto;">${certificateData.json_metadata}</pre>
        </div>

        <!-- Verification Footer -->
        <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
            <p style="color: #666; font-size: 0.9rem;">
                This certificate is verified by Caleon AI and secured on the blockchain.<br>
                Issued by <strong>${certificateData.issuer_web3_domain}</strong>
            </p>
        </div>
    `;
}

/**
 * Download certificate (demo - would generate PDF in real system)
 */
function downloadCertificate() {
    alert('📥 In a real system, this would download a PDF certificate.\n\nDemo: Certificate data has been generated with all authentic information that matches real NFT format.');
}

/**
 * Share certificate (demo)
 */
function shareCertificate() {
    const certificateData = demoMintState.certificate;
    const shareText = `Check out my TrueMark Certificate!\n\nSerial: ${certificateData.serial_number}\nToken ID: ${certificateData.token_id}\nWeb3 Domain: ${certificateData.issuer_web3_domain}\n\nVerified by Caleon AI on the blockchain.`;

    if (navigator.share) {
        navigator.share({
            title: 'TrueMark Certificate',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Certificate information copied to clipboard!');
        });
    }
}

/**
 * Reset demo
 */
function resetDemo() {
    demoMintState.currentStep = 1;
    demoMintState.certificate = null;
    demoMintState.formData = {};

    // Reset form
    document.getElementById('demoMintForm').reset();

    // Reset NFT type selection
    const standardRadio = document.getElementById('demoNftTypeStandard');
    if (standardRadio) standardRadio.checked = true;
    demoMintState.selectedNFTType = 'standard';

    // Reset network selection
    const polygonRadio = document.getElementById('demoNetworkPolygon');
    if (polygonRadio) polygonRadio.checked = true;
    demoMintState.selectedNetwork = 'polygon';

    showDemoStep(1);
    updateDemoStepIndicator();
}