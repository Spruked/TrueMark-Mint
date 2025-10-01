/**
 * TrueMark Mint Website JavaScript
 * Handles interactive features, form validation, and user interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('TrueMark Mint website loaded');
    
    // Initialize all components
    initializeNavigation();
    initializeFAQ();
    initializeForms();
    initializeMintingProcess();
    initializeAnimations();
    
    // Initialize authentication-related features
    if (window.authSystem) {
        updateNavigationForAuth();
        checkMintPageAccess();
    }
});

/**
 * Navigation functionality
 */
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        }
    });
}

/**
 * FAQ accordion functionality
 */
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

/**
 * Form handling and validation
 */
function initializeForms() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Asset form validation
    const assetForm = document.getElementById('assetForm');
    if (assetForm) {
        setupFormValidation(assetForm);
    }
    
    // Newsletter and other checkboxes
    setupCheckboxes();
}

function handleContactForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formSuccess = document.getElementById('formSuccess');
    
    if (!validateContactForm(form)) {
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        form.style.display = 'none';
        if (formSuccess) {
            formSuccess.style.display = 'block';
        }
    }, 2000);
}

function validateContactForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        showFieldError(emailField, 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#dc3545';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setupCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const form = this.closest('form');
            if (form) {
                updateFormSubmitButton(form);
            }
        });
    });
}

function updateFormSubmitButton(form) {
    const submitBtn = form.querySelector('button[type="submit"], .btn[id*="next"]');
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    
    if (submitBtn && requiredCheckboxes.length > 0) {
        const allChecked = Array.from(requiredCheckboxes).every(cb => cb.checked);
        submitBtn.disabled = !allChecked;
    }
}

/**
 * Minting process functionality
 */
function initializeMintingProcess() {
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const removeFileBtn = document.getElementById('removeFile');
    
    // File upload handling
    if (fileUploadArea && fileInput) {
        setupFileUpload(fileUploadArea, fileInput, fileInfo, removeFileBtn);
    }
    
    // Step navigation
    setupStepNavigation();
    
    // Minting process
    const mintBtn = document.getElementById('mintCertificate');
    if (mintBtn) {
        mintBtn.addEventListener('click', handleMinting);
    }
    
    // Certificate actions
    setupCertificateActions();
}

function setupFileUpload(uploadArea, fileInput, fileInfo, removeBtn) {
    let selectedFile = null;
    
    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Remove file
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            selectedFile = null;
            fileInput.value = '';
            uploadArea.style.display = 'block';
            fileInfo.style.display = 'none';
            updateStepButton('nextStep1', false);
        });
    }
    
    function handleFileSelection(file) {
        selectedFile = file;
        
        // Update UI
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'block';
        
        // Update file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('fileType').textContent = file.type || 'Unknown';
        
        // Enable next step
        updateStepButton('nextStep1', true);
        
        // Calculate hash (simulation)
        generateFileHash(file);
    }
    
    function generateFileHash(file) {
        // Simulate hash generation
        const hashElement = document.getElementById('reviewFileHash');
        if (hashElement) {
            hashElement.textContent = 'Calculating...';
            
            setTimeout(() => {
                const mockHash = generateMockHash(file.name + file.size);
                hashElement.textContent = mockHash;
            }, 1500);
        }
    }
    
    function generateMockHash(input) {
        // Simple mock hash generation for demo purposes
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function setupStepNavigation() {
    // Step buttons
    document.getElementById('nextStep1')?.addEventListener('click', () => goToStep(2));
    document.getElementById('nextStep2')?.addEventListener('click', () => goToStep(3));
    document.getElementById('prevStep2')?.addEventListener('click', () => goToStep(1));
    document.getElementById('prevStep3')?.addEventListener('click', () => goToStep(2));
    
    // Form validation for step 2
    const assetForm = document.getElementById('assetForm');
    if (assetForm) {
        const inputs = assetForm.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                updateStepButton('nextStep2', validateAssetForm());
            });
            input.addEventListener('change', () => {
                updateStepButton('nextStep2', validateAssetForm());
            });
        });
    }
}

function goToStep(stepNumber) {
    // Update progress indicators
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    
    steps.forEach((step, index) => {
        if (index + 1 <= stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Show current form step
    formSteps.forEach((formStep, index) => {
        if (index + 1 === stepNumber) {
            formStep.classList.add('active');
        } else {
            formStep.classList.remove('active');
        }
    });
    
    // Update review section if going to step 3
    if (stepNumber === 3) {
        updateReviewSection();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepButton(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = !enabled;
    }
}

function validateAssetForm() {
    const form = document.getElementById('assetForm');
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    const termsCheckbox = document.getElementById('termsAccept');
    
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            allValid = false;
        }
    });
    
    if (termsCheckbox && !termsCheckbox.checked) {
        allValid = false;
    }
    
    return allValid;
}

function updateReviewSection() {
    // Update file information
    const fileName = document.getElementById('fileName')?.textContent;
    const fileSize = document.getElementById('fileSize')?.textContent;
    const fileType = document.getElementById('fileType')?.textContent;
    
    if (fileName) document.getElementById('reviewFileName').textContent = fileName;
    if (fileSize) document.getElementById('reviewFileSize').textContent = fileSize;
    if (fileType) document.getElementById('reviewFileType').textContent = fileType;
    
    // Update asset details
    const title = document.getElementById('assetTitle')?.value;
    const creator = document.getElementById('creatorName')?.value;
    const email = document.getElementById('creatorEmail')?.value;
    const category = document.getElementById('assetCategory')?.selectedOptions[0]?.text;
    const license = document.getElementById('assetLicense')?.selectedOptions[0]?.text;
    
    if (title) document.getElementById('reviewTitle').textContent = title;
    if (creator) document.getElementById('reviewCreator').textContent = creator;
    if (email) document.getElementById('reviewEmail').textContent = email;
    if (category) document.getElementById('reviewCategory').textContent = category;
    if (license) document.getElementById('reviewLicense').textContent = license;
}

function handleMinting(e) {
    e.preventDefault();
    
    const mintBtn = e.target;
    mintBtn.classList.add('loading');
    mintBtn.disabled = true;
    
    // Simulate minting process
    setTimeout(() => {
        // Generate certificate data
        const certificateId = 'TM-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        const transactionId = '0x' + Math.random().toString(16).substr(2, 32);
        
        // Update certificate preview
        document.getElementById('certificateId').textContent = certificateId;
        document.getElementById('certAssetTitle').textContent = document.getElementById('reviewTitle').textContent;
        document.getElementById('certCreator').textContent = document.getElementById('reviewCreator').textContent;
        document.getElementById('certTimestamp').textContent = timestamp;
        document.getElementById('certTransaction').textContent = transactionId;
        
        // Go to final step
        goToStep(4);
    }, 3000);
}

function setupCertificateActions() {
    document.getElementById('downloadCert')?.addEventListener('click', () => {
        alert('Certificate download would start here');
    });
    
    document.getElementById('shareCert')?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'TrueMark Certificate',
                text: 'Check out my verified digital asset certificate',
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Certificate link copied to clipboard!');
        }
    });
    
    document.getElementById('verifyCert')?.addEventListener('click', () => {
        alert('This would open the verification portal');
    });
}

/**
 * Animations and interactive effects
 */
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe animated elements
    const animatedElements = document.querySelectorAll('.feature-card, .value-card, .team-member, .tech-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Number counting animation
    animateCounters();
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const suffix = counter.textContent.replace(/[\d,]/g, '');
            counter.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 16);
    });
}

/**
 * Utility functions
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 100; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Add loading states for external links
document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.addEventListener('click', function() {
        if (this.target === '_blank') {
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 500);
        }
    });
});

// Enterprise contact button
document.getElementById('enterpriseContact')?.addEventListener('click', () => {
    alert('This would open an enterprise contact form or calendar booking system');
});

// Live chat button
document.getElementById('openChat')?.addEventListener('click', () => {
    alert('This would open the live chat widget');
});

/**
 * Authentication-related functions
 */

/**
 * Update navigation based on authentication status
 */
function updateNavigationForAuth() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Remove existing auth nav item
    const existingAuthItem = document.querySelector('.auth-nav-item');
    if (existingAuthItem) {
        existingAuthItem.remove();
    }
    
    // Add new auth nav item
    const authItem = document.createElement('li');
    authItem.className = 'nav-item auth-nav-item';
    
    if (window.authSystem.isAuthenticated()) {
        const user = window.authSystem.getUser();
        authItem.innerHTML = `
            <div class="auth-user-menu">
                <span class="user-indicator">🏛️ ${user?.username || 'User'}</span>
                <a href="#" onclick="window.authSystem.logout()" class="nav-link logout-link">Logout</a>
            </div>
        `;
    } else {
        authItem.innerHTML = `<a href="login.html" class="nav-link login-link">🔐 Login</a>`;
    }
    
    navMenu.appendChild(authItem);
}

/**
 * Check if user can access mint page
 */
function checkMintPageAccess() {
    if (window.location.pathname.includes('mint.html')) {
        if (!window.authSystem.isAuthenticated()) {
            // Show authentication required overlay
            showAuthRequiredOverlay();
        } else {
            // Show authenticated mint interface
            showAuthenticatedMintInterface();
        }
    }
}

/**
 * Show authentication required overlay on mint page
 */
function showAuthRequiredOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'authRequiredOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 39, 65, 0.95);
        color: var(--pearl);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        text-align: center;
        padding: 2rem;
    `;
    
    overlay.innerHTML = `
        <div class="auth-required-content" style="max-width: 500px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🏛️</div>
            <h2 style="color: var(--gold); margin-bottom: 1rem; font-family: 'Merriweather', serif;">Authentication Required</h2>
            <p style="margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
                Access to the Alpha CertSig Mint portal requires secure authentication. 
                Please login with your authorized credentials to continue.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.location.href='login.html'" 
                        style="background: var(--gold); color: var(--navy); padding: 1rem 2rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    🔐 Secure Login
                </button>
                <button onclick="window.location.href='index.html'" 
                        style="background: transparent; color: var(--pearl); padding: 1rem 2rem; border: 2px solid var(--pearl); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    ← Return Home
                </button>
            </div>
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(248, 248, 245, 0.2); font-size: 0.875rem; color: rgba(248, 248, 245, 0.7);">
                Certified by Alpha CertSig Mint © 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/**
 * Show authenticated mint interface
 */
function showAuthenticatedMintInterface() {
    const user = window.authSystem.getUser();
    
    // Add user status to mint page
    const mintContainer = document.querySelector('.mint-container') || document.querySelector('main');
    if (mintContainer) {
        const userStatus = document.createElement('div');
        userStatus.className = 'mint-user-status';
        userStatus.style.cssText = `
            background: var(--gold);
            color: var(--navy);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 600;
        `;
        
        userStatus.innerHTML = `
            🏛️ Authenticated Session: ${user?.username || 'User'} | Role: ${user?.role || 'Minter'}
            <div style="font-size: 0.875rem; margin-top: 0.5rem; font-weight: normal;">
                Secure connection to Alpha CertSig Mint established
            </div>
        `;
        
        mintContainer.insertBefore(userStatus, mintContainer.firstChild);
    }
    
    // Enable mint functionality
    enableMintFunctionality();
}

/**
 * Enable mint functionality for authenticated users
 */
function enableMintFunctionality() {
    const mintButton = document.getElementById('mintNFT');
    if (mintButton) {
        mintButton.disabled = false;
        mintButton.textContent = '🏛️ Mint Certified NFT';
        
        // Add click handler for authenticated minting
        mintButton.addEventListener('click', handleAuthenticatedMint);
    }
    
    // Enable other mint-related features
    const mintForms = document.querySelectorAll('.mint-form input, .mint-form select');
    mintForms.forEach(input => {
        input.disabled = false;
    });
}

/**
 * Handle authenticated minting process
 */
async function handleAuthenticatedMint(e) {
    e.preventDefault();
    
    if (!window.authSystem.hasPermission('mint')) {
        alert('Your account does not have minting permissions. Please contact support.');
        return;
    }
    
    const mintButton = e.target;
    const originalText = mintButton.textContent;
    
    try {
        mintButton.disabled = true;
        mintButton.textContent = '🔄 Processing...';
        
        // Simulate minting process with Alpha CertSig Mint
        const mintResult = await processAuthenticatedMint();
        
        if (mintResult.success) {
            showMintSuccess(mintResult);
        } else {
            showMintError(mintResult.error);
        }
    } catch (error) {
        console.error('Minting error:', error);
        showMintError('Minting process failed. Please try again.');
    } finally {
        mintButton.disabled = false;
        mintButton.textContent = originalText;
    }
}

/**
 * Process authenticated mint with Alpha CertSig Mint
 */
async function processAuthenticatedMint() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful mint
            resolve({
                success: true,
                tokenId: Math.floor(Math.random() * 1000000),
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                certificationId: 'ALPHA-CERT-' + Date.now()
            });
        }, 3000);
    });
}

/**
 * Show mint success message
 */
function showMintSuccess(mintResult) {
    const successDiv = document.createElement('div');
    successDiv.className = 'mint-success';
    successDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 2rem;
        border-radius: 8px;
        margin: 2rem 0;
        border: 1px solid #c3e6cb;
        text-align: center;
    `;
    
    successDiv.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏛️</div>
        <h3 style="color: var(--navy); margin-bottom: 1rem;">NFT Successfully Minted!</h3>
        <p><strong>Token ID:</strong> ${mintResult.tokenId}</p>
        <p><strong>Certification ID:</strong> ${mintResult.certificationId}</p>
        <p><strong>Transaction:</strong> ${mintResult.transactionHash}</p>
        <div style="margin-top: 1rem; font-size: 0.875rem; color: #666;">
            Certified by Alpha CertSig Mint © 2025 TrueMark LLC
        </div>
    `;
    
    const mintContainer = document.querySelector('.mint-container') || document.querySelector('main');
    if (mintContainer) {
        mintContainer.appendChild(successDiv);
        
        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Show mint error message
 */
function showMintError(error) {
    alert('Minting Error: ' + error);
}

// Console greeting
console.log('%c🛡️ TrueMark Mint', 'color: #667eea; font-size: 24px; font-weight: bold;');
console.log('%cSecuring digital assets with blockchain technology', 'color: #666; font-size: 14px;');
console.log('%cWebsite by TrueMark Team © 2025', 'color: #999; font-size: 12px;');