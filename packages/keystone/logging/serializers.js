const pick = require('lodash/pick')
const toString = require('lodash/toString')
const stdSerializers = require('pino-std-serializers')

const { normalizeVariables } = require('./normalize')

const { safeFormatError } = require('../utils/errors/safeFormatError')

function toNumber (data) {
    const count = parseInt(data)
    if (isNaN(count)) return 0
    return count
}

function raw (data) {
    return data
}

function pickSerializer (...fields) {
    return function (data) {
        return pick(data, ...fields)
    }
}

const SERIALIZERS = {
    /** Default logger message field */
    msg: toString,

    /**
     * Main field to store large / dynamic data.
     * Will be stringified, so put here anything you want to read,
     * but not search by
     * */
    data: normalizeVariables,

    /**
     * Identifier of entity you want to search by,
     * use this pairing with entity field instead of organizationId, userId, somethingElseId
     */
    entityId: toString,

    /** Name of entity, to which entityId is related (Organization, B2BApp, User, SomeTask) */
    entity: toString,

    /**
     * Field of generic purpose used to aggregate data.
     * Fill it if you want to compute sum / avg / percentiles later,
     * otherwise consider using data
     */
    count: toNumber,

    /** HTTP status code, task status, or any other status you want to pass */
    status: toString,

    /** Generic error object */
    err: stdSerializers.err,

    /**
     * @deprecated used by graphql-error logger to format errors,
     * for generic errors consider using err instead
     * (you don't need safeFormat on bots / clients, since it'll be already formatted by API)
     * */
    error: safeFormatError,

    /** Used to collect memory usage via getHeapFree */
    mem: raw,

    /** ID of request. Will be filled automatically from execution context, don't pass it directly */
    reqId: toString,

    /** ID of error */
    errId: toString,

    /**
     * ID of stating request
     * TODO: think about obtaining it automatically same as req.id
     * */
    startReqId: toString,

    /** ID of execution Will be filled automatically from execution context, don't pass it directly, */
    execId: toString,


    /** ID of bull task. Will be filled automatically from execution context, don't pass it directly */
    taskId: toString,

    /** Name of gql query / mutation in current sub-request. Will be filled automatically from graphql context, don't pass it directly */
    gqlOperationName: toString,

    /** List of non-registered fields. Will be filled automatically by log shape analysis. Use this for future iterations of log-cleaning */
    unknownFields: raw,

    /** POST / GET / PUT and etc **/
    method: toString,

    /** http-request */
    req: stdSerializers.req,

    /** http-response */
    res: stdSerializers.res,

    /** Request path (/api/something) **/
    path: toString,

    /** Request IP */
    ip: toString,

    /** Resource URL */
    url: toString,

    /** Resource hostname */
    hostname: toString,

    /** Request headers */
    headers: toString,

    /** name of client, bot, integration, making a request */
    clientName: toString,

    /** time of server response / task execution in milliseconds */
    responseTime: toNumber,

    /** time of task execution in milliseconds */
    executionTime: toNumber,

    /** time of task procession (wait + execution/response time) */
    processingTime: toNumber,

    /** time of request waiting before execution */
    timeUntilExecution: toNumber,

    /** GQL-request state */
    state: toString,

    /**
     * session identifier
     * @deprecated use session.id instead
     * */
    sessionId: toString,

    /** session information (id, source, provider, clientID, createdBy) */
    session: pickSerializer('id', 'source', 'provider', 'clientID', 'createdBy'),

    /** device fingerprint */
    fingerprint: toString,

    /** request complexity */
    complexity: raw,

    /** user */
    user: raw,

    /** ID of current authenticated user (KS abstraction) */
    authedItemId: toString,

    /** GraphQL operation id */
    operationId: toString,

    /** GraphQL operation nam */
    operationName: toString,

    /** GraphQL query hash */
    queryHash: toString,

    /** GraphQL operations */
    graphQLOperations: raw,

    /** gql context (query, variable, size and etc) */
    gql: raw,

    /** name of app / package, where logger is initialized */
    package: toString,

    /** name of app domain, where logger is initialized */
    domain: toString,

    /** name of file, where logger is initialized */
    fileName: toString,

    /** name of task based on file, where logger is initialized */
    taskName: toString,

    /** runtime statistics of current container */
    runtimeStats: raw,

    /** name of queue where task is executed */
    queue: toString,

    /** task information (name, id, execution time, etc.) */
    task: raw,

    /** name of function related to log */
    functionName: toString,

    /** name of listKey related to log */
    listKey: toString,

    /** development / production. Used for services communicating with multiple envs at once (dev-portal) */
    environment: toString,
}

const KNOWN_FIELDS = new Set(Object.keys(SERIALIZERS))

module.exports = {
    SERIALIZERS,
    KNOWN_FIELDS,
}