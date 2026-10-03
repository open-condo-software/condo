const { BaseDataProvider } = require('./baseDataProvider')

/** Default provider: all reads/writes go through the Postgres list adapter. */
class PostgresDataProvider extends BaseDataProvider {}

module.exports = {
    PostgresDataProvider,
}
