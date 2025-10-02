/**
 * TrueMark Authentication System
 * Secure integration with Alpha CertSig Mint backend
 */

// Authentication configuration
const AUTH_CONFIG = {
    backend_url: 'http://localhost:5000', // Alpha-mint-engine backend
    session_duration: 24 * 60 * 60 * 1000, // 24 hours
    remember_duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    max_login_attempts: 3,
    lockout_duration: 15 * 60 * 1000, // 15 minutes
    demo_mode: true, // Enable demo mode by default for development
    connection_timeout: 5000 // 5 seconds timeout for backend connection
};

// Authentication state
let authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    sessionExpiry: null,
    permissions: []
};

// Security utilities
const SecurityUtils = {
    /**
     * Generate secure hash for client-side validation
     */
    async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Generate secure random salt
     */
    generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate JWT token structure
     */
    validateToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            // Decode payload to check expiration
            const payload = JSON.parse(atob(parts[1]));
            return payload.exp > Math.floor(Date.now() / 1000);
        } catch (e) {
            return false;
        }
    },

    /**
     * Check for suspicious activity
     */
    checkSecurity() {
        const attempts = parseInt(localStorage.getItem('login_attempts') || '0');
        const lastAttempt = parseInt(localStorage.getItem('last_attempt') || '0');
        const now = Date.now();
        
        if (attempts >= AUTH_CONFIG.max_login_attempts) {
            if (now - lastAttempt < AUTH_CONFIG.lockout_duration) {
                return { blocked: true, remainingTime: AUTH_CONFIG.lockout_duration - (now - lastAttempt) };
            } else {
                // Reset attempts after lockout period
                localStorage.removeItem('login_attempts');
                localStorage.removeItem('last_attempt');
            }
        }
        
        return { blocked: false };
    },

    /**
     * Record failed login attempt
     */
    recordFailedAttempt() {
        const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
        localStorage.setItem('login_attempts', attempts.toString());
        localStorage.setItem('last_attempt', Date.now().toString());
    },

    /**
     * Clear failed attempts on successful login
     */
    clearFailedAttempts() {
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('last_attempt');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Initialize login form if on login page
    if (document.getElementById('loginForm')) {
        initializeLoginForm();
    }
    
    // Initialize two-factor authentication
    initializeTwoFactor();
    
    // Protect mint page if on mint page
    if (window.location.pathname.includes('mint.html')) {
        protectMintPage();
    }
});

/**
 * Check current authentication status
 */
function checkAuthStatus() {
    const token = localStorage.getItem('truemark_token');
    const sessionExpiry = localStorage.getItem('truemark_session_expiry');
    
    if (token && sessionExpiry) {
        const now = new Date().getTime();
        const expiry = parseInt(sessionExpiry);
        
        if (now < expiry) {
            // Session is still valid
            authState.isAuthenticated = true;
            authState.token = token;
            authState.sessionExpiry = expiry;
            
            // Get user info from token (simplified)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                authState.user = payload.user;
            } catch (e) {
                console.warn('Invalid token format');
                clearAuthSession();
            }
        } else {
            // Session expired
            clearAuthSession();
        }
    }
    
    updateAuthUI();
}

/**
 * Initialize login form functionality
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            const showIcon = passwordToggle.querySelector('.show-icon');
            const hideIcon = passwordToggle.querySelector('.hide-icon');
            
            if (isPassword) {
                showIcon.style.display = 'none';
                hideIcon.style.display = 'inline';
            } else {
                showIcon.style.display = 'inline';
                hideIcon.style.display = 'none';
            }
        });
    }
    
    // Form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Forgot password handler
    document.getElementById('forgotPassword')?.addEventListener('click', handleForgotPassword);
    
    // Create account handler
    document.getElementById('createAccount')?.addEventListener('click', handleCreateAccount);
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const form = e.target;
    const loginBtn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    console.log('Login attempt:', { username, password: '***', rememberMe });
    
    if (!validateLoginForm(username, password)) {
        console.log('Form validation failed');
        return;
    }
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    try {
        console.log('Attempting authentication...');
        // Simulate API call to Alpha CertSig Mint authentication
        const authResult = await authenticateUser(username, password);
        console.log('Authentication result:', authResult);
        
        if (authResult.success) {
            console.log('Authentication successful');
            if (authResult.requiresTwoFactor) {
                // Show two-factor authentication modal
                showTwoFactorModal(authResult.tempToken);
            } else {
                // Complete login
                completeLogin(authResult, rememberMe);
            }
        } else {
            console.log('Authentication failed:', authResult.error);
            showLoginError(authResult.error || 'Authentication failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Please try again.');
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

/**
 * Authenticate user with Alpha CertSig Mint backend
 */
async function authenticateUser(username, password) {
    // Check for security blocks
    const securityCheck = SecurityUtils.checkSecurity();
    if (securityCheck.blocked) {
        const minutes = Math.ceil(securityCheck.remainingTime / 60000);
        throw new Error(`Account temporarily locked. Try again in ${minutes} minutes.`);
    }

    // If demo mode is enabled or no backend is available, use demo authentication
    if (AUTH_CONFIG.demo_mode) {
        console.info('Using demo mode for authentication');
        return authenticateUserDemo(username, password);
    }

    try {
        // Test backend connectivity first
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.connection_timeout);

        // Generate secure hash for password (client-side pre-processing)
        const salt = SecurityUtils.generateSalt();
        const hashedPassword = await SecurityUtils.hashPassword(password, salt);

        // Prepare authentication request
        const authRequest = {
            email: username.trim().toLowerCase(),
            password: password,
            timestamp: Date.now(),
            device_info: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };

        // Send authentication request to Alpha-mint-engine
        const response = await fetch(`${AUTH_CONFIG.backend_url}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Version': '1.0.0',
                'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify(authRequest),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        if (response.ok && result.success) {
            // Clear failed attempts on successful login
            SecurityUtils.clearFailedAttempts();
            
            // Validate received token
            if (result.token && SecurityUtils.validateToken(result.token)) {
                return {
                    success: true,
                    token: result.token,
                    user: result.user,
                    permissions: result.permissions || [],
                    requiresTwoFactor: result.requiresTwoFactor || false,
                    tempToken: result.tempToken
                };
            } else {
                throw new Error('Invalid authentication token received');
            }
        } else {
            // Record failed attempt
            SecurityUtils.recordFailedAttempt();
            
            throw new Error(result.error || 'Authentication failed');
        }
    } catch (error) {
        // If backend is not available, fall back to demo mode for development
        if (error.name === 'AbortError' ||
            error.message.includes('fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch') ||
            error.name === 'TypeError' ||
            error.code === 'ECONNREFUSED') {
            console.warn('Backend not available, falling back to demo mode');
            return authenticateUserDemo(username, password);
        }
        
        throw error;
    }
}

/**
 * Demo authentication for development (when backend is not available)
 */
async function authenticateUserDemo(username, password) {
    console.log('Demo authentication mode');
    console.log('Checking credentials:', { username, password: '***' });
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo credentials
            if ((username === 'bryan@truemark.com' || username === 'admin') && password === 'admin123') {
                console.log('Bryan/Admin credentials matched');
                resolve({
                    success: true,
                    token: generateDemoToken(username, 'admin'),
                    user: {
                        username: username,
                        email: username === 'bryan@truemark.com' ? username : 'admin@truemarkmint.com',
                        name: username === 'bryan@truemark.com' ? 'Bryan Anthony Spruk' : 'Admin User',
                        role: 'Founder & CEO',
                        permissions: ['mint', 'verify', 'manage', 'admin']
                    },
                    permissions: ['mint', 'verify', 'manage', 'admin'],
                    requiresTwoFactor: false
                });
            } else if (username === 'demo@truemark.com' && password === 'demo123') {
                console.log('Demo credentials matched');
                resolve({
                    success: true,
                    token: generateDemoToken(username, 'demo'),
                    user: {
                        username: username,
                        email: username,
                        name: 'Demo User',
                        role: 'User',
                        permissions: ['mint']
                    },
                    permissions: ['mint'],
                    requiresTwoFactor: false
                });
            } else if (username === 'minter' && password === 'mint123') {
                console.log('Minter credentials matched');
                resolve({
                    success: true,
                    token: generateDemoToken(username, 'minter'),
                    user: {
                        username: username,
                        role: 'minter',
                        email: 'minter@truemarkmint.com',
                        permissions: ['mint', 'verify']
                    },
                    permissions: ['mint', 'verify'],
                    requiresTwoFactor: true,
                    tempToken: generateDemoTempToken(username)
                });
            } else {
                console.log('No credentials matched, authentication failed');
                SecurityUtils.recordFailedAttempt();
                reject(new Error('Invalid email or password'));
            }
        }, 1200); // Simulate network delay
    });
}

/**
 * Generate demo JWT token for development
 */
function generateDemoToken(username, role) {
    const header = btoa(JSON.stringify({
        typ: 'JWT',
        alg: 'HS256',
        kid: 'truemark-demo'
    }));
    
    const payload = btoa(JSON.stringify({
        sub: username,
        username: username,
        role: role,
        iss: 'truemark-mint',
        aud: 'truemark-clients',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        permissions: role === 'admin' ? ['mint', 'verify', 'manage', 'admin'] : 
                    role === 'minter' ? ['mint', 'verify'] : ['mint']
    }));
    
    const signature = btoa('demo_signature_' + Math.random().toString(36).substr(2, 16));
    
    return `${header}.${payload}.${signature}`;
}

/**
 * Generate demo temporary token for 2FA
 */
function generateDemoTempToken(username) {
    return btoa(JSON.stringify({
        user: username,
        temp: true,
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    }));
}

/**
 * Validate login form inputs
 */
function validateLoginForm(username, password) {
    let isValid = true;
    
    // Clear previous errors
    clearFieldErrors();
    
    if (!username || username.length < 3) {
        showFieldError('username', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show field validation error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentNode;
    
    field.style.borderColor = '#dc3545';
    
    let errorDiv = formGroup.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        formGroup.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
}

/**
 * Clear all field errors
 */
function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
    });
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const form = document.getElementById('loginForm');
    
    let errorDiv = document.querySelector('.login-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #f5c6cb;
        `;
        form.insertBefore(errorDiv, form.firstChild);
    }
    
    errorDiv.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

/**
 * Complete successful login
 */
function completeLogin(authResult, rememberMe) {
    const expiryTime = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    
    // Store authentication data
    localStorage.setItem('truemark_token', authResult.token);
    localStorage.setItem('truemark_session_expiry', expiryTime.toString());
    localStorage.setItem('truemark_user', JSON.stringify(authResult.user));
    
    // Update auth state
    authState.isAuthenticated = true;
    authState.token = authResult.token;
    authState.user = authResult.user;
    authState.sessionExpiry = expiryTime;
    
    // Show success message
    const form = document.getElementById('loginForm');
    const success = document.getElementById('loginSuccess');
    
    form.style.display = 'none';
    success.style.display = 'block';
    
    // Redirect to mint page
    setTimeout(() => {
        window.location.href = 'mint.html';
    }, 2000);
}

/**
 * Initialize two-factor authentication
 */
function initializeTwoFactor() {
    const modal = document.getElementById('twoFactorModal');
    const closeBtn = document.getElementById('closeTwoFactor');
    const cancelBtn = document.getElementById('cancelTwoFactor');
    const verifyBtn = document.getElementById('verifyTwoFactor');
    const codeInputs = document.querySelectorAll('.code-input');
    
    // Close modal handlers
    [closeBtn, cancelBtn].forEach(btn => {
        btn?.addEventListener('click', hideTwoFactorModal);
    });
    
    // Code input handlers
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });
    
    // Verify button handler
    verifyBtn?.addEventListener('click', verifyTwoFactorCode);
}

/**
 * Show two-factor authentication modal
 */
function showTwoFactorModal(tempToken) {
    const modal = document.getElementById('twoFactorModal');
    modal.style.display = 'flex';
    modal.dataset.tempToken = tempToken;
    
    // Focus first input
    const firstInput = modal.querySelector('.code-input');
    if (firstInput) {
        firstInput.focus();
    }
}

/**
 * Hide two-factor authentication modal
 */
function hideTwoFactorModal() {
    const modal = document.getElementById('twoFactorModal');
    modal.style.display = 'none';
    
    // Clear inputs
    modal.querySelectorAll('.code-input').forEach(input => {
        input.value = '';
    });
}

/**
 * Verify two-factor authentication code
 */
async function verifyTwoFactorCode() {
    const modal = document.getElementById('twoFactorModal');
    const inputs = modal.querySelectorAll('.code-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    const tempToken = modal.dataset.tempToken;
    
    if (code.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }
    
    try {
        // Simulate 2FA verification
        const result = await verifyTwoFactor(tempToken, code);
        
        if (result.success) {
            hideTwoFactorModal();
            completeLogin(result, false);
        } else {
            alert('Invalid verification code');
            // Clear inputs
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        alert('Verification failed. Please try again.');
    }
}

/**
 * Verify 2FA code with backend
 */
async function verifyTwoFactor(tempToken, code) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Demo: accept code "123456"
            if (code === '123456') {
                resolve({
                    success: true,
                    token: generateMockToken('demo'),
                    user: {
                        username: 'demo',
                        role: 'minter',
                        permissions: ['mint', 'verify']
                    }
                });
            } else {
                resolve({ success: false });
            }
        }, 1000);
    });
}

/**
 * Handle forgot password
 */
function handleForgotPassword(e) {
    e.preventDefault();
    alert('Password reset requests must be submitted through our support team. Please contact support@truemarkmint.com');
}

/**
 * Handle create account request
 */
function handleCreateAccount(e) {
    e.preventDefault();
    alert('New account access requires approval from our security team. Please contact support for enterprise licensing.');
}

/**
 * Protect mint page - redirect to login if not authenticated
 */
function protectMintPage() {
    if (!authState.isAuthenticated) {
        // Show access required message and redirect
        if (confirm('Authentication required to access the minting portal. Redirect to login?')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'index.html';
        }
        return;
    }
    
    // Show authenticated user info on mint page
    showUserInfo();
}

/**
 * Show user information on authenticated pages
 */
function showUserInfo() {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-auth-info';
    userInfo.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: var(--navy);
        color: var(--pearl);
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 999;
        font-size: 0.875rem;
    `;
    
    userInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span>🏛️</span>
            <strong>Authenticated Session</strong>
        </div>
        <div>User: ${authState.user?.username || 'Unknown'}</div>
        <div>Role: ${authState.user?.role || 'Unknown'}</div>
        <button onclick="logout()" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: var(--gold); color: var(--navy); border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Logout</button>
    `;
    
    document.body.appendChild(userInfo);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        userInfo.style.opacity = '0.7';
    }, 10000);
}

/**
 * Update authentication UI elements
 */
function updateAuthUI() {
    // Add login/logout buttons to navigation if needed
    const nav = document.querySelector('.nav-menu');
    if (nav && !document.querySelector('.auth-nav-item')) {
        const authItem = document.createElement('li');
        authItem.className = 'nav-item auth-nav-item';
        
        if (authState.isAuthenticated) {
            authItem.innerHTML = `<a href="#" onclick="logout()" class="nav-link">Logout</a>`;
        } else {
            authItem.innerHTML = `<a href="login.html" class="nav-link">Login</a>`;
        }
        
        nav.appendChild(authItem);
    }
}

/**
 * Logout user
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAuthSession();
        window.location.href = 'index.html';
    }
}

/**
 * Clear authentication session
 */
function clearAuthSession() {
    localStorage.removeItem('truemark_token');
    localStorage.removeItem('truemark_session_expiry');
    localStorage.removeItem('truemark_user');
    
    authState.isAuthenticated = false;
    authState.user = null;
    authState.token = null;
    authState.sessionExpiry = null;
}

/**
 * Get authentication token for API calls
 */
function getAuthToken() {
    return authState.token;
}

/**
 * Check if user has specific permission
 */
function hasPermission(permission) {
    return authState.user?.permissions?.includes(permission) || false;
}

/**
 * Fill login form with demo credentials
 */
function fillCredentials(username, password) {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (usernameField && passwordField) {
        usernameField.value = username;
        passwordField.value = password;
        
        // Add visual feedback
        usernameField.style.background = 'rgba(198, 169, 78, 0.1)';
        passwordField.style.background = 'rgba(198, 169, 78, 0.1)';
        
        // Clear the highlight after a moment
        setTimeout(() => {
            usernameField.style.background = '';
            passwordField.style.background = '';
        }, 1000);
        
        // Focus on login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.focus();
        }
    }
}

// Make fillCredentials globally accessible
window.fillCredentials = fillCredentials;

// Export functions for use in other scripts
window.authSystem = {
    isAuthenticated: () => authState.isAuthenticated,
    getUser: () => authState.user,
    getUserType: getUserType,
    getPreferredNetwork: getPreferredNetwork,
    getToken: getAuthToken,
    hasPermission: hasPermission,
    logout: logout
};

/**
 * Get user type for network preference
 */
function getUserType() {
    if (!authState.user) return 'demo';
    
    // Determine user type based on role/permissions
    if (authState.user.role === 'admin') return 'admin';
    if (authState.user.role === 'enterprise' || authState.user.permissions?.includes('enterprise')) return 'enterprise';
    if (authState.user.role === 'minter') return 'minter';
    return 'personal';
}

/**
 * Get preferred network for user type
 */
function getPreferredNetwork() {
    const userType = getUserType();
    
    switch (userType) {
        case 'admin':
        case 'enterprise':
            return 'ethereum';
        case 'minter':
        case 'personal':
        case 'demo':
        default:
            return 'polygon';
    }
}