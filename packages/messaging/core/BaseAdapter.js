/**
 * Base messaging adapter interface.
 * All broker adapters must extend this class and implement the required methods.
 */
class BaseAdapter {
    /**
     * Connect to the message broker.
     * @param {Object} config - Broker-specific connection configuration
     * @returns {Promise<void>}
     */
    async connect (config) {
        throw new Error('BaseAdapter.connect() must be implemented')
    }

    /**
     * Disconnect from the message broker.
     * @returns {Promise<void>}
     */
    async disconnect () {
        throw new Error('BaseAdapter.disconnect() must be implemented')
    }

    /**
     * Whether the adapter is currently connected.
     * @returns {boolean}
     */
    get connected () {
        return false
    }

    /**
     * Ensure a channel exists with the given configuration.
     * Creates or updates the channel as needed.
     * @param {Object} channelConfig
     * @param {string} channelConfig.name
     * @param {string[]} channelConfig.topics - Topic patterns this channel captures
     * @param {number} [channelConfig.ttl] - Message TTL in seconds
     * @param {'memory' | 'file'} [channelConfig.storage]
     * @param {'limits' | 'interest' | 'workqueue'} [channelConfig.retention]
     * @returns {Promise<{ created: boolean, updated: boolean }>}
     */
    async ensureChannel (channelConfig) {
        throw new Error('BaseAdapter.ensureChannel() must be implemented')
    }

    /**
     * Delete a channel.
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    async deleteChannel (name) {
        throw new Error('BaseAdapter.deleteChannel() must be implemented')
    }

    /**
     * Publish a message to a topic.
     * @param {string} topic - Full topic string
     * @param {*} data - Message payload (will be JSON-encoded)
     * @returns {Promise<void>}
     */
    async publish (topic, data) {
        throw new Error('BaseAdapter.publish() must be implemented')
    }

    /**
     * Subscribe to a topic pattern (server-side).
     * @param {string} pattern - Topic pattern with wildcards
     * @param {Function} callback - Called with (data, msg) for each message
     * @returns {Promise<Object>} Subscription handle
     */
    async subscribe (pattern, callback) {
        throw new Error('BaseAdapter.subscribe() must be implemented')
    }

    /**
     * Start the authentication service (optional, broker-specific).
     * @param {Object} config
     * @returns {Promise<void>}
     */
    async startAuthService (config) {
        // No-op by default; override in broker-specific adapters
    }

    /**
     * Stop the authentication service.
     * @returns {Promise<void>}
     */
    async stopAuthService () {
        // No-op by default
    }

    /**
     * Start the subscription relay service (optional, broker-specific).
     * @param {Object} config
     * @returns {Promise<void>}
     */
    async startRelayService (config) {
        // No-op by default
    }

    /**
     * Stop the subscription relay service.
     * @returns {Promise<void>}
     */
    async stopRelayService () {
        // No-op by default
    }
}

module.exports = { BaseAdapter }
