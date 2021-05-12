
// assume format `[type:error:field] message`
const JSON_EXPECT_OBJECT_ERROR = '[json:expectObject:'
const JSON_EXPECT_ARRAY_ERROR = '[json:expectArray:'
const JSON_NO_NULL_ERROR = '[json:noNull:'
const JSON_UNKNOWN_VERSION_ERROR = '[json:unknownDataVersion:'
const JSON_WRONG_VERSION_FORMAT_ERROR = '[json:wrongDataVersionFormat:'
const JSON_SCHEMA_VALIDATION_ERROR = '[json:schemaValidationError:'
const UNIQUE_ALREADY_EXISTS_ERROR = '[unique:alreadyExists:'
const REQUIRED_NO_VALUE_ERROR = '[required:noValue:'
const DV_UNKNOWN_VERSION_ERROR = '[dv:unknownDataVersion:'
const STATUS_UPDATED_AT_ERROR = '[dv:incorrectStatusUpdatedAt:'

const ALREADY_EXISTS_ERROR = '[constrain:alreadyExists:'

const WRONG_TEXT_FORMAT = '[text:wrongFormat:'

module.exports = {
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    JSON_EXPECT_ARRAY_ERROR,
    JSON_NO_NULL_ERROR,
    JSON_SCHEMA_VALIDATION_ERROR,    
    UNIQUE_ALREADY_EXISTS_ERROR,
    REQUIRED_NO_VALUE_ERROR,
    DV_UNKNOWN_VERSION_ERROR,
    ALREADY_EXISTS_ERROR,
    STATUS_UPDATED_AT_ERROR,
    WRONG_TEXT_FORMAT,
}
