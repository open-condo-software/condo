require('dotenv').config();

module.exports = {
    PROJECT_NAME: process.env.PROJECT_NAME || 'my-keystone-app',
    // DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1/main',
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://mongo:mongo@127.0.0.1/main?authSource=admin',
    MEDIA_ROOT: process.env.MEDIA_ROOT || '__media',
    MEDIA_URL: process.env.MEDIA_URL || '/media',
    DIST_DIR: process.env.DIST_DIR || 'dist',
    NODE_ENV: process.env.NODE_ENV || 'production',
    INCLUDE_NEXT_APP: process.env.INCLUDE_NEXT_APP,
};
