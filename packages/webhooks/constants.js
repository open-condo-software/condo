const DEFAULT_MAX_PACK_SIZE = 100
// TODO(DOMA-4570) Correct this value based on received stats, when actual skip-send logic will be implemented
const DEFAULT_UNAVAILABILITY_THRESHOLD = 10
const WEBHOOK_OPERATIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
}

module.exports = {
    DEFAULT_MAX_PACK_SIZE,
    DEFAULT_UNAVAILABILITY_THRESHOLD,
    WEBHOOK_OPERATIONS,
}