
// assume format `[type:error:field] message`
const JSON_EXPECT_OBJECT_ERROR = '[json:expectObject:'
const JSON_EXPECT_ARRAY_ERROR = '[json:expectArray:'
const JSON_NO_NULL_ERROR = '[json:noNull:'
const JSON_UNKNOWN_VERSION_ERROR = '[json:unknownDataVersion:'
const JSON_WRONG_VERSION_FORMAT_ERROR = '[json:wrongDataVersionFormat:'
const UNIQUE_ALREADY_EXISTS_ERROR = '[unique:alreadyExists:'
const REQUIRED_NO_VALUE_ERROR = '[required:noValue:'
const DV_UNKNOWN_VERSION_ERROR = '[dv:unknownDataVersion:'
const STATUS_UPDATED_AT_ERROR = '[dv:incorrectStatusUpdatedAt:'

const WRONG_PASSWORD_ERROR = '[passwordAuth:secret:mismatch'
const EMPTY_PASSWORD_ERROR = '[passwordAuth:secret:notSet'
const WRONG_EMAIL_ERROR = '[passwordAuth:identity:notFound'
const EMAIL_ALREADY_REGISTERED_ERROR = '[register:email:multipleFound'

const ALREADY_EXISTS_ERROR = '[constrain:alreadyExists:'

const WRONG_TEXT_FORMAT = '[text:wrongFormat:'

module.exports = {
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    JSON_EXPECT_ARRAY_ERROR,
    JSON_NO_NULL_ERROR,
    UNIQUE_ALREADY_EXISTS_ERROR,
    REQUIRED_NO_VALUE_ERROR,
    DV_UNKNOWN_VERSION_ERROR,
    WRONG_PASSWORD_ERROR,
    EMPTY_PASSWORD_ERROR,
    WRONG_EMAIL_ERROR,
    EMAIL_ALREADY_REGISTERED_ERROR,
    ALREADY_EXISTS_ERROR,
    STATUS_UPDATED_AT_ERROR,
    WRONG_TEXT_FORMAT,
}
