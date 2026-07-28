const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const GuildAuthMiddleware = require('./middleware/GuildAuthMiddleware');
const { withDashboardBasePath } = require('../../../config/urlConfig');

/**
 * Router class to handle all web routes in the application
 */
class Router {
    /**
     * @param {import('./AuthController')} authController 
     * @param {import('./GuildController')} guildController 
     * @param {import('./GameController')} gameController
     * @param {import('../../core/domain/ports/in/UserPort')} userService
     * @param {import('../../core/domain/ports/in/GuildPort')} guildService
     */
    constructor(authController, guildController, gameController, userService, guildService) {
        this.router = express.Router();
        this.authController = authController;
        this.guildController = guildController;
        this.gameController = gameController;
        
        // Initialize the guild auth middleware
        this.guildAuthMiddleware = new GuildAuthMiddleware(userService, guildService);
        
        this.setupRoutes();
    }

    /**
     * Create a rate limiter middleware
     * @param {number} windowMs
     * @param {number} maxRequests
     * @returns {Function}
     */
    createRateLimiter(windowMs, maxRequests) {
        return rateLimit({
            windowMs,
            max: maxRequests,
            standardHeaders: true,
            legacyHeaders: false,
            message: 'Too many requests, please try again later.'
        });
    }
    
    /**
     * Middleware to check if user is authenticated
     */
    isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect(withDashboardBasePath('/login'));
    }
    
    /**
     * Setup all application routes
     */
    setupRoutes() {
        const authRateLimiter = this.createRateLimiter(15 * 60 * 1000, 60);
        const apiRateLimiter = this.createRateLimiter(15 * 60 * 1000, 300);

        // Auth routes
        this.router.get('/', 
            authRateLimiter,
            this.isAuthenticated,
            (req, res, next) => this.guildController.renderDashboard(req, res, next)
        );
        this.router.get('/dashboard', authRateLimiter, (req, res) => res.redirect(withDashboardBasePath('/')));
        this.router.get('/login', authRateLimiter, (req, res, next) => this.authController.renderLogin(req, res, next));
        this.router.get('/logout', (req, res, next) => this.authController.handleLogout(req, res, next));
        
        this.router.get('/auth/discord', authRateLimiter, passport.authenticate('discord', { 
            scope: ['identify', 'guilds'] 
        }));
        
        this.router.get('/auth/callback', 
            authRateLimiter,
            passport.authenticate('discord', { 
                failureRedirect: withDashboardBasePath('/login')
            }),
            (req, res, next) => this.authController.handleAuthCallback(req, res, next)
        );
        
        // Dashboard API Routes with /gnf/ prefix - only the ones actually used by the frontend
        // Game routes - these are the only ones used by the frontend client
        this.router.get('/gnf/guilds/:guildId/games', 
            apiRateLimiter,
            this.isAuthenticated,
            this.guildAuthMiddleware.checkGuildPermission(),
            (req, res, next) => this.gameController.getGuildGames(req, res, next)
        );
        
        this.router.get('/gnf/guilds/:guildId/stats', 
            apiRateLimiter,
            this.isAuthenticated,
            this.guildAuthMiddleware.checkGuildPermission(),
            (req, res, next) => this.gameController.getGuildGameStats(req, res, next)
        );
        
        this.router.post('/gnf/guilds/:guildId/games/:gameId/toggle', 
            apiRateLimiter,
            this.isAuthenticated,
            this.guildAuthMiddleware.checkGuildPermission(),
            (req, res, next) => this.gameController.toggleGameSubscription(req, res, next)
        );
        
        // Static pages
        this.router.get('/privacy-policy', (req, res) => {
            res.render('pages/privacy_policy');
        });        this.router.get('/tos', (req, res) => {
            res.render('pages/terms_of_service');
        });
        
        // 404 handler for unmatched routes - this should only trigger for actual 404s
        this.router.use((req, res, next) => {
            // Only create 404 error if no response has been sent yet
            if (!res.headersSent) {
                const err = new Error('Page not found');
                err.statusCode = 404;
                next(err);
            }
        });
    }
    
    /**
     * Get the configured router
     * @returns {express.Router} The configured Express router
     */
    getRouter() {
        return this.router;
    }
}

module.exports = Router;