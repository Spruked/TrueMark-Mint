#!/usr/bin/env node

/**
 * Environment Synchronization and Validation Script
 * Ensures consistent and secure environment configuration across services
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentSync {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.envExample = path.join(this.projectRoot, '.env.example');
        this.envFile = path.join(this.projectRoot, '.env');
        this.alphaEngineEnv = path.join(this.projectRoot, 'Alpha-mint-engine', '.env');
        this.websiteEnv = path.join(this.projectRoot, 'truemark-website', '.env');
        
        this.requiredVars = [
            'SECRET_KEY',
            'JWT_SECRET',
            'API_KEY',
            'MONGODB_URI',
            'POLYGON_RPC_URL',
            'ETHEREUM_RPC_URL',
            'PRIVATE_KEY_HASH'
        ];
        
        this.optionalVars = [
            'IPFS_PROJECT_ID',
            'IPFS_PROJECT_SECRET',
            'SMTP_USER',
            'SMTP_PASSWORD'
        ];
    }

    /**
     * Generate cryptographically secure random strings
     */
    generateSecureKey(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Parse environment file
     */
    parseEnvFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return {};
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const env = {};
        
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return env;
    }

    /**
     * Write environment file
     */
    writeEnvFile(filePath, env, template = null) {
        let content = '';
        
        if (template && fs.existsSync(template)) {
            const templateContent = fs.readFileSync(template, 'utf8');
            const lines = templateContent.split('\n');
            
            for (const line of lines) {
                if (line.trim() && !line.startsWith('#') && line.includes('=')) {
                    const [key] = line.split('=');
                    const cleanKey = key.trim();
                    if (env[cleanKey]) {
                        content += `${cleanKey}=${env[cleanKey]}\n`;
                    } else {
                        content += line + '\n';
                    }
                } else {
                    content += line + '\n';
                }
            }
        } else {
            // Fallback: simple key=value format
            for (const [key, value] of Object.entries(env)) {
                content += `${key}=${value}\n`;
            }
        }
        
        fs.writeFileSync(filePath, content);
    }

    /**
     * Validate environment configuration
     */
    validateEnvironment(env) {
        const errors = [];
        const warnings = [];
        
        // Check required variables
        for (const varName of this.requiredVars) {
            if (!env[varName] || env[varName].includes('your-') || env[varName].includes('change-this')) {
                errors.push(`Missing or placeholder value for required variable: ${varName}`);
            }
        }
        
        // Check optional variables
        for (const varName of this.optionalVars) {
            if (!env[varName] || env[varName].includes('your-') || env[varName].includes('change-this')) {
                warnings.push(`Optional variable has placeholder value: ${varName}`);
            }
        }
        
        // Validate key formats
        if (env.PRIVATE_KEY_HASH && !env.PRIVATE_KEY_HASH.startsWith('0x') && env.PRIVATE_KEY_HASH.length !== 66) {
            errors.push('PRIVATE_KEY_HASH should be a 64-character hex string with 0x prefix');
        }
        
        if (env.MONGODB_URI && !env.MONGODB_URI.startsWith('mongodb')) {
            errors.push('MONGODB_URI should start with mongodb:// or mongodb+srv://');
        }
        
        return { errors, warnings };
    }

    /**
     * Generate secure defaults for missing variables
     */
    generateDefaults(env) {
        const defaults = { ...env };
        
        // Generate secure keys if missing or placeholder
        if (!defaults.SECRET_KEY || defaults.SECRET_KEY.includes('your-') || defaults.SECRET_KEY.includes('change-this')) {
            defaults.SECRET_KEY = this.generateSecureKey(32);
            console.log('Generated new SECRET_KEY');
        }
        
        if (!defaults.JWT_SECRET || defaults.JWT_SECRET.includes('your-') || defaults.JWT_SECRET.includes('change-this')) {
            defaults.JWT_SECRET = this.generateSecureKey(32);
            console.log('Generated new JWT_SECRET');
        }
        
        if (!defaults.API_KEY || defaults.API_KEY.includes('your-') || defaults.API_KEY.includes('change-this')) {
            defaults.API_KEY = this.generateSecureKey(24);
            console.log('Generated new API_KEY');
        }
        
        // Set production defaults
        defaults.NODE_ENV = defaults.NODE_ENV || 'production';
        defaults.FLASK_ENV = defaults.FLASK_ENV || 'production';
        
        return defaults;
    }

    /**
     * Synchronize environment across all services
     */
    async sync(options = {}) {
        console.log('🔄 Starting environment synchronization...');
        
        try {
            // Read existing configurations
            const exampleEnv = this.parseEnvFile(this.envExample);
            const mainEnv = this.parseEnvFile(this.envFile);
            
            // Merge configurations with secure defaults
            const mergedEnv = { ...exampleEnv, ...mainEnv };
            const secureEnv = this.generateDefaults(mergedEnv);
            
            // Validate configuration
            const validation = this.validateEnvironment(secureEnv);
            
            if (validation.errors.length > 0) {
                console.error('❌ Environment validation failed:');
                validation.errors.forEach(error => console.error(`  - ${error}`));
                
                if (!options.force) {
                    console.log('Use --force to continue with errors');
                    process.exit(1);
                }
            }
            
            if (validation.warnings.length > 0) {
                console.warn('⚠️  Environment warnings:');
                validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }
            
            // Write synchronized environment files
            console.log('📝 Writing environment files...');
            
            // Main .env file
            this.writeEnvFile(this.envFile, secureEnv, this.envExample);
            console.log(`  ✅ Created ${this.envFile}`);
            
            // Alpha-mint-engine .env
            const alphaEngineDir = path.dirname(this.alphaEngineEnv);
            if (!fs.existsSync(alphaEngineDir)) {
                fs.mkdirSync(alphaEngineDir, { recursive: true });
            }
            this.writeEnvFile(this.alphaEngineEnv, secureEnv);
            console.log(`  ✅ Created ${this.alphaEngineEnv}`);
            
            // Website .env (subset for frontend)
            const websiteEnvVars = {
                NODE_ENV: secureEnv.NODE_ENV,
                BACKEND_URL: secureEnv.BACKEND_URL || 'http://localhost:5000',
                POLYGON_RPC_URL: secureEnv.POLYGON_RPC_URL,
                ETHEREUM_RPC_URL: secureEnv.ETHEREUM_RPC_URL
            };
            
            const websiteDir = path.dirname(this.websiteEnv);
            if (!fs.existsSync(websiteDir)) {
                fs.mkdirSync(websiteDir, { recursive: true });
            }
            this.writeEnvFile(this.websiteEnv, websiteEnvVars);
            console.log(`  ✅ Created ${this.websiteEnv}`);
            
            // Security recommendations
            console.log('\n🔒 Security Recommendations:');
            console.log('  - Never commit .env files to version control');
            console.log('  - Rotate secrets regularly in production');
            console.log('  - Use proper secret management for production deployments');
            console.log('  - Verify all placeholder values have been replaced');
            
            console.log('\n✅ Environment synchronization completed successfully!');
            
        } catch (error) {
            console.error('❌ Environment synchronization failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Check environment status
     */
    async status() {
        console.log('📊 Environment Status:');
        
        const files = [
            { name: 'Main .env', path: this.envFile },
            { name: 'Alpha-mint-engine .env', path: this.alphaEngineEnv },
            { name: 'Website .env', path: this.websiteEnv }
        ];
        
        for (const file of files) {
            if (fs.existsSync(file.path)) {
                const env = this.parseEnvFile(file.path);
                const validation = this.validateEnvironment(env);
                
                console.log(`\n${file.name}:`);
                console.log(`  📍 Path: ${file.path}`);
                console.log(`  📊 Variables: ${Object.keys(env).length}`);
                console.log(`  ❌ Errors: ${validation.errors.length}`);
                console.log(`  ⚠️  Warnings: ${validation.warnings.length}`);
                
                if (validation.errors.length > 0) {
                    validation.errors.forEach(error => console.log(`    - ${error}`));
                }
            } else {
                console.log(`\n${file.name}: ❌ Not found`);
            }
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'sync';
    const options = {
        force: args.includes('--force')
    };
    
    const envSync = new EnvironmentSync();
    
    switch (command) {
        case 'sync':
            envSync.sync(options);
            break;
        case 'status':
            envSync.status();
            break;
        default:
            console.log('Usage: node env-sync.js [sync|status] [--force]');
            process.exit(1);
    }
}

module.exports = EnvironmentSync;