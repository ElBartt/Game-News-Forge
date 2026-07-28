/**
 * Normalize dashboard base path from env
 * @returns {string}
 */
function getDashboardBasePath() {
    const rawBasePath = process.env.DASHBOARD_BASE_PATH || '';

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
