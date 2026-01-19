/**
 * Application Constants
 */

const USER_ROLES = {
    ADMIN: 'ADMIN',
    CATALOGER: 'CATALOGER',
    CURATOR: 'CURATOR',
    VIEWER: 'VIEWER'
};

const USER_ROLES_ARRAY = Object.values(USER_ROLES);

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

module.exports = {
    USER_ROLES,
    USER_ROLES_ARRAY,
    PAGINATION
};
