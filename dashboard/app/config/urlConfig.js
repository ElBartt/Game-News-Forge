const DEFAULT_PROD_BASE_PATH = '/dashboard';

/**
 * Normalize dashboard base path from env
 * @returns {string}
 */
function getDashboardBasePath() {
    const configuredBasePath = process.env.DASHBOARD_BASE_PATH;
    const fallbackBasePath = process.env.NODE_ENV === 'prod' ? DEFAULT_PROD_BASE_PATH : '';
    const rawBasePath = configuredBasePath !== undefined ? configuredBasePath : fallbackBasePath;

    if (!rawBasePath || rawBasePath === '/') {
        return '';
    }

    const prefixed = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`;
    return prefixed.replace(/\/+$/, '');
}

/**
 * Prefix URL path with dashboard base path
 * @param {string} path
 * @returns {string}
 */
function withDashboardBasePath(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const prefixedPath = `${getDashboardBasePath()}${normalizedPath}`;
    return prefixedPath || '/';
}

module.exports = {
    getDashboardBasePath,
    withDashboardBasePath
};
