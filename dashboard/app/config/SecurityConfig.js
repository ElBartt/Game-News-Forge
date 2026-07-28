const helmet = require('helmet');
const crypto = require('crypto');
const config = require('@shared/config');
const { getApiBaseUrl } = require('./apiConfig');

/**
 * Configuration for application security
 */
class SecurityConfig {
    /**
     * @param {Express.Application} app - Express application
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Configure security middleware
     */
    setupSecurity() {
        const apiUrl = getApiBaseUrl();

        // Generate a secure nonce for inline scripts
        this.app.use((req, res, next) => {
            res.locals.nonce = crypto.randomBytes(16).toString('base64');
            next();
        });

        // Add security headers with helmet
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "https://cdn.discordapp.com", "data:"],
                    connectSrc: ["'self'", apiUrl],
                    workerSrc: ["'self'"],
                    // Add scriptSrcElem for ES modules support in some browsers
                    scriptSrcElem: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`]
                }
            }
        }));

        // Handle API URL configuration differently for dev vs prod
        this.app.use((req, res, next) => {
            // In production with Nginx, use relative paths
            if (config.isProd()) {
                res.locals.apiBaseUrl = ''; // Empty for relative URLs
            } else {
                // In development, use the configured API_ENDPOINT and API_PORT
                res.locals.apiBaseUrl = apiUrl;
            }
            next();
        });
    }

    /**
     * Initialize security config
     */
    init() {
        this.setupSecurity();
    }
}

module.exports = SecurityConfig;