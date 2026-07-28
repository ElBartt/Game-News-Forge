/**
 * Build API base URL from environment
 * @returns {string}
 */
function getApiBaseUrl() {
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL.replace(/\/+$/, '');
    }

    const apiPort = process.env.API_PORT || 8080;
    const apiEndpoint = process.env.API_ENDPOINT || 'http://localhost';
    const endpointWithoutTrailingSlash = apiEndpoint.replace(/\/+$/, '');
    const hasExplicitPort = /:\d+(?:\/|$)/.test(endpointWithoutTrailingSlash);

    if (hasExplicitPort) {
        return endpointWithoutTrailingSlash;
    }

    if (endpointWithoutTrailingSlash.includes('https://') && !endpointWithoutTrailingSlash.includes('localhost')) {
        return endpointWithoutTrailingSlash;
    }

    return `${endpointWithoutTrailingSlash}:${apiPort}`;
}

module.exports = {
    getApiBaseUrl
};
