/**
 * Alpha CertSig NFT Taxonomy Configuration
 * Complete taxonomy with 7 NFT types, pricing, and features
 */

class NFTTaxonomy {
    constructor() {
        // Pricing tiers configuration
        this.pricingPhase = 'entry'; // 'entry' or 'premium'
        
        this.nftTypes = {
            knowledge: {
                key: 'K',
                name: 'Knowledge NFT',
                shortName: 'K-NFT',
                icon: '📘',
                color: '#2563eb', // Blue
                colorClass: 'knowledge',
                description: 'Personal certifications and small-scale knowledge proof',
                tooltip: 'Perfect for personal achievements, skills, and small certifications',
                features: ['personal-use', 'standard-metadata', 'individual-ownership'],
                contractType: 'standard',
                updatableMetadata: false,
                royaltyEnabled: true,
                pricing: {
                    entry: { min: 9.95, max: 14.95 },
                    premium: { min: 14.95, max: 29.95 }
                },
                useCase: 'Individual creators, personal achievements, skill certifications',
                examples: ['Professional certificates', 'Personal milestones', 'Skill demonstrations']
            },
            legacy: {
                key: 'L',
                name: 'Legacy NFT',
                shortName: 'L-NFT',
                icon: '🏛️',
                color: '#1e3a8a', // Dark Navy
                colorClass: 'legacy',
                description: 'Family heritage records with updatable metadata for generations',
                tooltip: 'Family records that can be updated across generations',
                features: ['updatable-metadata', 'generational-transfer', 'family-heritage'],
                contractType: 'updatable',
                updatableMetadata: true,
                royaltyEnabled: true,
                pricing: {
                    entry: { min: 19.95, max: 39.95 },
                    premium: { min: 79.95, max: 149.95 }
                },
                useCase: 'Family records, genealogy, heritage preservation',
                examples: ['Family trees', 'Historical records', 'Generational assets']
            },
            heirloom: {
                key: 'H',
                name: 'Heirloom NFT',
                shortName: 'H-NFT',
                icon: '🏆',
                color: '#c6a94e', // Gold
                colorClass: 'heirloom',
                description: 'Cultural and collective works with updatable annotations',
                tooltip: 'Cultural treasures with evolving annotations and inheritance tracking',
                features: ['updatable-metadata', 'cultural-significance', 'collective-ownership'],
                contractType: 'updatable',
                updatableMetadata: true,
                royaltyEnabled: true,
                pricing: {
                    entry: { min: 49.95, max: 79.95 },
                    premium: { min: 199, max: 499 }
                },
                useCase: 'Cultural artifacts, collective works, significant items',
                examples: ['Cultural artifacts', 'Community assets', 'Inherited valuables']
            },
            academic: {
                key: 'A',
                name: 'Academic NFT',
                shortName: 'A-NFT',
                icon: '📚',
                color: '#16a34a', // Green
                colorClass: 'academic',
                description: 'Research proofs and timestamped academic publications',
                tooltip: 'Academic research with timestamp proof and publication records',
                features: ['timestamp-proof', 'research-validation', 'publication-record'],
                contractType: 'standard',
                updatableMetadata: false,
                royaltyEnabled: true,
                pricing: {
                    entry: { min: 14.95, max: 29.95 },
                    premium: { min: 49.95, max: 99.95 }
                },
                useCase: 'Academic research, publications, intellectual contributions',
                examples: ['Research papers', 'Academic achievements', 'Scientific discoveries']
            },
            enterprise: {
                key: 'E',
                name: 'Enterprise NFT',
                shortName: 'E-NFT',
                icon: '📊',
                color: '#dc2626', // Red
                colorClass: 'enterprise',
                description: 'Business IP contracts and enterprise licensing agreements',
                tooltip: 'Business contracts and IP with built-in licensing capabilities',
                features: ['business-contracts', 'ip-protection', 'licensing-royalties'],
                contractType: 'royalty',
                updatableMetadata: false,
                royaltyEnabled: true,
                licensingRoyalty: true,
                pricing: {
                    entry: { min: 199, max: 499 },
                    premium: { min: 1000, max: null }
                },
                useCase: 'Business contracts, intellectual property, enterprise licensing',
                examples: ['Business agreements', 'IP licensing', 'Corporate assets']
            },
            custom: {
                key: 'C',
                name: 'Custom NFT',
                shortName: 'C-NFT',
                icon: '⚙️',
                color: '#6b7280', // Silver/Gray
                colorClass: 'custom',
                description: 'Flexible white-label solution for special clients',
                tooltip: 'Fully customizable NFTs for unique requirements and institutions',
                features: ['white-label', 'custom-contract', 'institutional-grade'],
                contractType: 'custom',
                updatableMetadata: true,
                royaltyEnabled: true,
                pricing: {
                    entry: { custom: true },
                    premium: { custom: true, enterpriseOnly: true }
                },
                useCase: 'Special clients, institutions, unique requirements',
                examples: ['Government records', 'Institutional assets', 'Special projects']
            },
            licensable: {
                key: 'Lic',
                name: 'Licensable NFT',
                shortName: 'Lic-NFT',
                icon: '🔑',
                color: '#7c3aed', // Purple
                colorClass: 'licensable',
                description: 'NFTs with built-in licensing agreements and royalty tracking',
                tooltip: 'Revenue-generating NFTs with licensing agreements and royalty streams',
                features: ['licensing-agreements', 'royalty-tracking', 'recurring-revenue'],
                contractType: 'royalty',
                updatableMetadata: false,
                royaltyEnabled: true,
                licensingRoyalty: true,
                pricing: {
                    entry: { min: 29.95, max: 99.95 },
                    premium: { min: 149, max: 499 }
                },
                useCase: 'Revenue-generating assets, licensing agreements, royalty streams',
                examples: ['Licensed content', 'Royalty agreements', 'Revenue streams'],
                licenseFields: ['scope', 'duration', 'exclusivity', 'territory', 'royaltyRate']
            }
        };

        this.royaltyRates = {
            resale: 1.5, // 1.5% on all resales
            licensing: 3.0 // 3% on licensing revenue
        };

        this.contractTypes = {
            standard: {
                description: 'Standard ERC-721 NFT',
                features: ['basic-ownership', 'transfer', 'royalties']
            },
            updatable: {
                description: 'ERC-721 with updatable metadata',
                features: ['basic-ownership', 'transfer', 'royalties', 'metadata-updates']
            },
            royalty: {
                description: 'ERC-721 with EIP-2981 royalty standard',
                features: ['basic-ownership', 'transfer', 'royalties', 'licensing-tracking']
            },
            custom: {
                description: 'Custom contract implementation',
                features: ['configurable', 'white-label', 'enterprise-grade']
            }
        };
    }

    /**
     * Get NFT type configuration
     * @param {string} typeKey - NFT type key
     * @returns {Object|null} NFT type configuration
     */
    getNFTType(typeKey) {
        return this.nftTypes[typeKey] || null;
    }

    /**
     * Get all NFT types
     * @returns {Object} All NFT type configurations
     */
    getAllNFTTypes() {
        return this.nftTypes;
    }

    /**
     * Get NFT type keys
     * @returns {Array} Array of NFT type keys
     */
    getNFTTypeKeys() {
        return Object.keys(this.nftTypes);
    }

    /**
     * Get current pricing for NFT type
     * @param {string} typeKey - NFT type key
     * @returns {Object|null} Pricing information
     */
    getPricing(typeKey) {
        const nftType = this.getNFTType(typeKey);
        if (!nftType) return null;

        const pricing = nftType.pricing[this.pricingPhase];
        return {
            phase: this.pricingPhase,
            ...pricing,
            currency: 'USD',
            isCustom: pricing.custom || false,
            isEnterpriseOnly: pricing.enterpriseOnly || false
        };
    }

    /**
     * Set pricing phase
     * @param {string} phase - 'entry' or 'premium'
     * @returns {boolean} Success status
     */
    setPricingPhase(phase) {
        if (['entry', 'premium'].includes(phase)) {
            this.pricingPhase = phase;
            return true;
        }
        return false;
    }

    /**
     * Get current pricing phase
     * @returns {string} Current pricing phase
     */
    getPricingPhase() {
        return this.pricingPhase;
    }

    /**
     * Get royalty rates
     * @returns {Object} Royalty rate configuration
     */
    getRoyaltyRates() {
        return this.royaltyRates;
    }

    /**
     * Check if NFT type supports feature
     * @param {string} typeKey - NFT type key
     * @param {string} feature - Feature to check
     * @returns {boolean} Feature support status
     */
    supportsFeature(typeKey, feature) {
        const nftType = this.getNFTType(typeKey);
        return nftType?.features?.includes(feature) || false;
    }

    /**
     * Get NFT types by contract type
     * @param {string} contractType - Contract type
     * @returns {Array} Array of NFT types using this contract
     */
    getNFTTypesByContract(contractType) {
        return Object.entries(this.nftTypes)
            .filter(([key, type]) => type.contractType === contractType)
            .map(([key, type]) => ({ key, ...type }));
    }

    /**
     * Get recommended NFT type for use case
     * @param {string} useCase - Use case category
     * @returns {Array} Recommended NFT types
     */
    getRecommendedTypes(useCase) {
        const recommendations = {
            personal: ['knowledge', 'legacy'],
            family: ['legacy', 'heirloom'],
            business: ['enterprise', 'licensable'],
            academic: ['academic', 'knowledge'],
            cultural: ['heirloom', 'custom'],
            revenue: ['licensable', 'enterprise']
        };

        return recommendations[useCase] || [];
    }

    /**
     * Format price display
     * @param {string} typeKey - NFT type key
     * @returns {string} Formatted price string
     */
    formatPrice(typeKey) {
        const pricing = this.getPricing(typeKey);
        if (!pricing) return 'N/A';

        if (pricing.isCustom) {
            return pricing.isEnterpriseOnly ? 'Enterprise Only' : 'Custom Pricing';
        }

        if (pricing.max === null) {
            return `$${pricing.min}+`;
        }

        if (pricing.min === pricing.max) {
            return `$${pricing.min}`;
        }

        return `$${pricing.min} - $${pricing.max}`;
    }

    /**
     * Get NFT type by key character
     * @param {string} keyChar - Key character (K, L, H, E, A, C, Lic)
     * @returns {Object|null} NFT type or null
     */
    getNFTTypeByKey(keyChar) {
        return Object.values(this.nftTypes).find(type => type.key === keyChar) || null;
    }

    /**
     * Validate NFT type selection
     * @param {string} typeKey - NFT type key
     * @param {Object} userContext - User context (type, permissions, etc.)
     * @returns {Object} Validation result
     */
    validateSelection(typeKey, userContext = {}) {
        const nftType = this.getNFTType(typeKey);
        
        if (!nftType) {
            return {
                valid: false,
                errors: [`Invalid NFT type: ${typeKey}`]
            };
        }

        const errors = [];
        const pricing = this.getPricing(typeKey);

        // Check enterprise-only restrictions
        if (pricing.isEnterpriseOnly && userContext.userType !== 'enterprise') {
            errors.push('This NFT type requires enterprise access');
        }

        // Check custom pricing requirements
        if (pricing.isCustom && !userContext.hasCustomPricing) {
            errors.push('Custom pricing required - please contact sales');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            nftType: nftType,
            pricing: pricing
        };
    }
}

// Create global instance
const nftTaxonomy = new NFTTaxonomy();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFTTaxonomy;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.NFTTaxonomy = NFTTaxonomy;
    window.nftTaxonomy = nftTaxonomy;
}