module.exports = {
    PROJECT_NAME: 'my-keystone-app',
    // DATABASE_URL: 'postgresql://postgres:postgres@postgresdb/main',
    DATABASE_URL: 'mongodb://mongo:mongo@127.0.0.1/main?authSource=admin',
    KEYSTONE_ADAPTER_TYPE: 'mongoose' || 'knex',
    MEDIA_ROOT: '__media',
    MEDIA_URL: '/media',
    DIST_DIR: 'dist',
    NODE_ENV: process.env.NODE_ENV,
};
