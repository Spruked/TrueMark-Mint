#!/usr/bin/env node

/**
 * TrueMark Mint Production Validation Script
 * Comprehensive testing of all critical fixes and production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionValidator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.errors = [];
        this.warnings = [];
        this.passed = [];
        
        this.testSuites = [
            'validateJavaScriptIntegrity',
            'validateErrorHandling',
            'validateDockerConfiguration',
            'validateEnvironmentSecurity',
            'validateFileStructure',
            'validateGitHygiene'
        ];
    }

    log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'error': '❌',
            'warn': '⚠️',
            'pass': '✅',
            'info': 'ℹ️'
        }[level] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
        if (details) {
            console.log(`   ${details}`);
        }
        
        if (level === 'error') this.errors.push(message);
        if (level === 'warn') this.warnings.push(message);
        if (level === 'pass') this.passed.push(message);
    }

    async validateJavaScriptIntegrity() {
        this.log('info', 'Validating JavaScript integrity...');
        
        try {
            // Check for duplicate function definitions
            const integrationsPath = path.join(this.projectRoot, 'truemark-website', 'assets', 'js', 'integrations.js');
            const mintPath = path.join(this.projectRoot, 'truemark-website', 'assets', 'js', 'mint.js');
            
            if (!fs.existsSync(integrationsPath)) {
                this.log('error', 'integrations.js not found', integrationsPath);
                return false;
            }
            
            const integrationsContent = fs.readFileSync(integrationsPath, 'utf8');
            
            // Check for duplicate function definitions
            const connectWalletMatches = integrationsContent.match(/function\s+connectWallet|window\.connectWallet\s*=/g);
            if (connectWalletMatches && connectWalletMatches.length > 1) {
                this.log('error', `Found ${connectWalletMatches.length} connectWallet function definitions - should be 1`);
                return false;
            }
            
            const switchNetworkMatches = integrationsContent.match(/window\.switchNetwork\s*=/g);
            if (switchNetworkMatches && switchNetworkMatches.length > 1) {
                this.log('error', `Found ${switchNetworkMatches.length} switchNetwork function definitions - should be 1`);
                return false;
            }
            
            const switchPhaseMatches = integrationsContent.match(/window\.switchPhase\s*=/g);
            if (switchPhaseMatches && switchPhaseMatches.length > 1) {
                this.log('error', `Found ${switchPhaseMatches.length} switchPhase function definitions - should be 1`);
                return false;
            }
            
            // Check for required global exports
            const requiredExports = ['connectWallet', 'switchNetwork', 'switchPhase', 'selectPaymentMethod', 'processPayment'];
            for (const exportName of requiredExports) {
                if (!integrationsContent.includes(`window.${exportName}`)) {
                    this.log('error', `Missing global export: window.${exportName}`);
                    return false;
                }
            }
            
            // Check for error handler integration
            if (!integrationsContent.includes('window.errorHandler')) {
                this.log('error', 'Error handler not integrated into integrations.js');
                return false;
            }
            
            this.log('pass', 'JavaScript integrity validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'JavaScript validation failed', error.message);
            return false;
        }
    }

    async validateErrorHandling() {
        this.log('info', 'Validating error handling system...');
        
        try {
            const errorHandlerPath = path.join(this.projectRoot, 'truemark-website', 'assets', 'js', 'error-handler.js');
            const mintHtmlPath = path.join(this.projectRoot, 'truemark-website', 'mint.html');
            
            if (!fs.existsSync(errorHandlerPath)) {
                this.log('error', 'error-handler.js not found');
                return false;
            }
            
            const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');
            
            // Check for required error handling methods
            const requiredMethods = [
                'handleWalletError',
                'handlePaymentError',
                'handleNetworkError',
                'handleApiError',
                'withErrorHandling'
            ];
            
            for (const method of requiredMethods) {
                if (!errorHandlerContent.includes(method)) {
                    this.log('error', `Missing error handling method: ${method}`);
                    return false;
                }
            }
            
            // Check error handler is loaded in HTML
            if (fs.existsSync(mintHtmlPath)) {
                const htmlContent = fs.readFileSync(mintHtmlPath, 'utf8');
                if (!htmlContent.includes('error-handler.js')) {
                    this.log('error', 'error-handler.js not included in mint.html');
                    return false;
                }
                
                // Check loading order (error-handler should be first)
                const scriptTags = htmlContent.match(/<script[^>]*src="[^"]*\.js"[^>]*>/g) || [];
                const errorHandlerIndex = scriptTags.findIndex(tag => tag.includes('error-handler.js'));
                if (errorHandlerIndex !== 0) {
                    this.log('warn', 'error-handler.js should be loaded first for proper dependency order');
                }
            }
            
            this.log('pass', 'Error handling system validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'Error handling validation failed', error.message);
            return false;
        }
    }

    async validateDockerConfiguration() {
        this.log('info', 'Validating Docker configuration...');
        
        try {
            const dockerComposePath = path.join(this.projectRoot, 'docker-compose.yml');
            const frontendDockerfilePath = path.join(this.projectRoot, 'Dockerfile.frontend');
            const backendDockerfilePath = path.join(this.projectRoot, 'Dockerfile.backend');
            
            if (!fs.existsSync(dockerComposePath)) {
                this.log('error', 'docker-compose.yml not found');
                return false;
            }
            
            const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
            
            // Check for required services
            const requiredServices = ['frontend', 'backend', 'nginx'];
            for (const service of requiredServices) {
                if (!dockerComposeContent.includes(`${service}:`)) {
                    this.log('error', `Missing Docker service: ${service}`);
                    return false;
                }
            }
            
            // Check port mappings
            if (!dockerComposeContent.includes('8081:8080')) {
                this.log('error', 'Missing or incorrect frontend port mapping (should be 8081:8080)');
                return false;
            }
            
            // Check backend CORS configuration
            const appPyPath = path.join(this.projectRoot, 'Alpha-mint-engine', 'app.py');
            if (fs.existsSync(appPyPath)) {
                const appPyContent = fs.readFileSync(appPyPath, 'utf8');
                if (!appPyContent.includes('localhost:8081') || !appPyContent.includes('localhost:8080')) {
                    this.log('error', 'Backend CORS not configured for Docker ports');
                    return false;
                }
            }
            
            this.log('pass', 'Docker configuration validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'Docker validation failed', error.message);
            return false;
        }
    }

    async validateEnvironmentSecurity() {
        this.log('info', 'Validating environment security...');
        
        try {
            const envExamplePath = path.join(this.projectRoot, '.env.example');
            const envSyncPath = path.join(this.projectRoot, 'scripts', 'env-sync.js');
            
            if (!fs.existsSync(envExamplePath)) {
                this.log('error', '.env.example not found');
                return false;
            }
            
            if (!fs.existsSync(envSyncPath)) {
                this.log('error', 'env-sync.js script not found');
                return false;
            }
            
            const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
            
            // Check for required environment variables
            const requiredVars = ['SECRET_KEY', 'JWT_SECRET', 'API_KEY', 'MONGODB_URI'];
            for (const varName of requiredVars) {
                if (!envExampleContent.includes(varName)) {
                    this.log('error', `Missing required environment variable: ${varName}`);
                    return false;
                }
            }
            
            // Check that .env is in .gitignore
            const gitignorePath = path.join(this.projectRoot, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                if (!gitignoreContent.includes('.env')) {
                    this.log('warn', '.env files should be in .gitignore');
                }
            }
            
            this.log('pass', 'Environment security validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'Environment security validation failed', error.message);
            return false;
        }
    }

    async validateFileStructure() {
        this.log('info', 'Validating file structure...');
        
        try {
            const requiredFiles = [
                'truemark-website/assets/js/integrations.js',
                'truemark-website/assets/js/error-handler.js',
                'truemark-website/mint.html',
                'Alpha-mint-engine/app.py',
                'docker-compose.yml',
                'scripts/env-sync.js',
                'README.md',
                '.gitignore'
            ];
            
            for (const file of requiredFiles) {
                const filePath = path.join(this.projectRoot, file);
                if (!fs.existsSync(filePath)) {
                    this.log('error', `Required file missing: ${file}`);
                    return false;
                }
            }
            
            // Check file sizes (basic sanity check)
            const integrationsPath = path.join(this.projectRoot, 'truemark-website', 'assets', 'js', 'integrations.js');
            const integrationsStats = fs.statSync(integrationsPath);
            if (integrationsStats.size < 10000) { // Less than 10KB seems too small
                this.log('warn', 'integrations.js seems unexpectedly small');
            }
            
            this.log('pass', 'File structure validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'File structure validation failed', error.message);
            return false;
        }
    }

    async validateGitHygiene() {
        this.log('info', 'Validating Git hygiene...');
        
        try {
            // Check if we're in a git repository
            if (!fs.existsSync(path.join(this.projectRoot, '.git'))) {
                this.log('warn', 'Not a Git repository');
                return true; // Not fatal
            }
            
            // Check .gitignore
            const gitignorePath = path.join(this.projectRoot, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                const requiredIgnores = ['.env', 'node_modules/', '*.log', '.DS_Store'];
                for (const ignore of requiredIgnores) {
                    if (!gitignoreContent.includes(ignore)) {
                        this.log('warn', `${ignore} should be in .gitignore`);
                    }
                }
            }
            
            // Check for sensitive files that shouldn't be committed
            try {
                const result = execSync('git ls-files', { cwd: this.projectRoot, encoding: 'utf8' });
                const trackedFiles = result.split('\n').filter(f => f.trim());
                
                const sensitivePatterns = [/\.env$/, /\.key$/, /\.pem$/];
                for (const file of trackedFiles) {
                    for (const pattern of sensitivePatterns) {
                        if (pattern.test(file)) {
                            this.log('error', `Sensitive file tracked in Git: ${file}`);
                            return false;
                        }
                    }
                }
            } catch (error) {
                this.log('warn', 'Could not check Git status', error.message);
            }
            
            this.log('pass', 'Git hygiene validation passed');
            return true;
            
        } catch (error) {
            this.log('error', 'Git hygiene validation failed', error.message);
            return false;
        }
    }

    async runValidation() {
        console.log('🚀 Starting TrueMark Mint Production Validation\n');
        
        const results = [];
        
        for (const testSuite of this.testSuites) {
            console.log(`\n📋 Running ${testSuite}...`);
            try {
                const result = await this[testSuite]();
                results.push({ testSuite, result });
            } catch (error) {
                this.log('error', `Test suite ${testSuite} crashed`, error.message);
                results.push({ testSuite, result: false });
            }
        }
        
        // Generate summary
        console.log('\n📊 Validation Summary:');
        console.log('========================');
        
        const passedTests = results.filter(r => r.result).length;
        const totalTests = results.length;
        
        console.log(`✅ Passed: ${this.passed.length} checks`);
        console.log(`⚠️  Warnings: ${this.warnings.length} issues`);
        console.log(`❌ Errors: ${this.errors.length} critical issues`);
        console.log(`📊 Test Suites: ${passedTests}/${totalTests} passed\n`);
        
        if (this.errors.length > 0) {
            console.log('❌ Critical Issues Found:');
            this.errors.forEach(error => console.log(`  - ${error}`));
            console.log('');
        }
        
        if (this.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
            console.log('');
        }
        
        // Production readiness assessment
        const isProductionReady = this.errors.length === 0 && passedTests === totalTests;
        
        if (isProductionReady) {
            console.log('🎉 PRODUCTION READY!');
            console.log('All critical systems validated successfully.');
            console.log('TrueMark Mint is ready for deployment.');
        } else {
            console.log('🚫 NOT PRODUCTION READY');
            console.log('Please address critical issues before deployment.');
        }
        
        return {
            isProductionReady,
            passedTests,
            totalTests,
            errors: this.errors.length,
            warnings: this.warnings.length,
            passed: this.passed.length
        };
    }
}

// CLI interface
if (require.main === module) {
    const validator = new ProductionValidator();
    validator.runValidation()
        .then(result => {
            process.exit(result.isProductionReady ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation crashed:', error);
            process.exit(1);
        });
}

module.exports = ProductionValidator;