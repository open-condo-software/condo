const { isEmpty, isString, isFunction, get, isObject, isArray, isUndefined } = require('lodash')
const { addSearchField, FIELD_NAME_REGEX } = require('./utils/searchField')
const { addSearchUpdateTrigger } = require('./utils/searchUpdateTrigger')


// TODO (DOMA-4545)
//  [✔] Need add index for search field
//  [✔] Add a check for changes to tracked fields
//  [✔] Add search field update when related entities update
//  [✔] Add search field update when related entities was deleted
//  [✔] Move logic to global preprocessor
//  [✔] Update access to search fields
//  [✔] Add preprocessor validation checks
//  [ ] Move search options from index.js
//  [ ] Fixed default value for field (?)
//  [ ] Add check for related fields (?)

// TODO PROBLEMS (DOMA-4545)
//  [ ] Do not update the "v" and "updatedAt" fields so that tickets do not start updating on mobile devices after updating the search field


/**
 * @param {SearchFieldParameter[]} searchFieldsParameters
 */
const checkParameters = (searchFieldsParameters) => {
    if (!searchFieldsParameters || !isArray(searchFieldsParameters) || isEmpty(searchFieldsParameters)) {
        throw new Error('"searchFieldsParameters" field must be of type "array" and not empty!')
    }

    for (const params of searchFieldsParameters) {
        if (!params || !isObject(params)) throw new Error('Each parameters element must have a "schemaName" required field, and at least one of the fields: "simpleFields" or "relatedFields"!')

        if (!isUndefined(params.searchField) && !isString(params.searchField)) throw new Error('The "searchField" field must be a string!')

        if (!params.schemaName || !isString(params.schemaName)) throw new Error('The "schemaName" field must be a string!')

        if (!params.simpleFields && !params.relatedFields) throw new Error('Each parameters element must have at least one of the fields: "simpleFields" or "relatedFields"!')

        if (!isUndefined(params.simpleFields)) {
            if (isEmpty(params.simpleFields) || !isObject(params.simpleFields)) {
                throw new Error('"simpleFields" must have a "pathsToFields" required field, and can have "preprocessorsForFields" optional field!')
            }

            const pathsToFields = get(params, 'simpleFields.pathsToFields')
            if (!pathsToFields || !isArray(pathsToFields) || isEmpty(pathsToFields)) {
                throw new Error('"simpleFields.pathsToFields" field must be of type "array" and not empty!')
            }
            for (const pathToField of pathsToFields) {
                if (!pathsToFields || !isString(pathToField)) throw new Error(`Each element of the "simpleFields.pathsToFields" array must be of type "string"!. But it was: "${typeof pathToField}" for path "${pathToField}"`)
                const pathToFieldToArray = pathToField.split('.')
                for (const field of pathToFieldToArray) {
                    if (!FIELD_NAME_REGEX.test(field)) throw new Error(`Field names in "simpleFields.pathsToFields" must consist of letters (a-z) and must be in the format "fieldName" or "fieldName1.fieldName2" (if the field is in a related schema)! But it was: "${field}" in path "${pathToField}".`)
                }
            }

            const preprocessorsForFields = get(params, 'simpleFields.preprocessorsForFields')
            if (!isUndefined(preprocessorsForFields)) {
                if (!isObject(params.simpleFields)) throw new Error('"simpleFields.preprocessorsForFields" field must be of type "object"! (Template: { [fieldName]: (value) => newValue })')
                for (const field in preprocessorsForFields) {
                    const preprocessor = preprocessorsForFields[field]
                    if (!isFunction(preprocessor)) throw new Error(`Preprocessors must be functions! But it was: "${typeof preprocessor}" for the field "${field}"`)
                }
            }
        }

        if (!isUndefined(params.relatedFields)) {
            if (isEmpty(params.relatedFields) || !isArray(params.relatedFields)) {
                throw new Error('"relatedFields" field must be of type "array" and not empty!')
            }

            for (const { pathsToFields, schemaName, schemaGql } of params.relatedFields) {
                if (!schemaName || !isString(schemaName)) throw new Error('"schemaName" field in "relatedFields" must be of type "string"!')
                if (schemaName === params.schemaName) throw new Error(`The related model "${schemaName}" must not be the target model "${params.schemaName}"!`)

                if (!schemaGql) throw new Error('"schemaGql" field is required!')

                if (!pathsToFields || !isArray(pathsToFields) || isEmpty(pathsToFields)) throw new Error('"pathsToFields" field in "relatedFields" must be of type "array" and not empty!')
                for (const pathToField of pathsToFields) {
                    if (!pathToField || !isString(pathToField)) throw new Error(`Each element of the "relatedFields[i].pathsToFields" array must be of type "string"!. But it was: "${typeof pathToField}" for path "${pathToField}"`)
                    const pathToFieldToArray = pathToField.split('.')
                    if (pathToFieldToArray.length < 2) throw new Error('"relatedFields[i].pathsToFields" field must be contained element with path to related field!')
                    for (const field of pathToFieldToArray) {
                        if (!FIELD_NAME_REGEX.test(field)) throw new Error(`Field names in "relatedFields[i].pathsToFields" must consist of letters (a-z) and must be in the format "fieldName" or "fieldName1.fieldName2" (if the field is in a related schema)! But it was: "${field}" in path "${pathToField}".`)
                    }
                }
            }
        }
    }
}

/**
 * @typedef Triggers
 * @property {string} schema
 * @property {RelatedData[]} relatedData
 */

/**
 * @typedef RelatedField
 * @property {string} schemaName
 * @property {string[]} pathsToFields
 * @property schemaGql
 */

/**
 * @typedef SimpleFields
 * @property {string[]} pathsToFields
 * @property {Object<string, function>} preprocessorsForFields
 */

/**
 * @typedef SearchFieldParameter
 * @property {string?} searchField
 * @property {string} schemaName
 * @property {SimpleFields?} simpleFields
 * @property {RelatedField[]?} relatedFields
 */

/**
 * @param {SearchFieldParameter[]} searchFieldsParameters
 */
const searchFieldPreprocessor = (searchFieldsParameters = []) => {
    checkParameters(searchFieldsParameters)

    /**
     * @type {RelatedData[]}
     */
    const allRelatedFields = searchFieldsParameters
        .filter(params => isArray(params.relatedFields))
        .flatMap((params) => params.relatedFields.map((item) => ({
            schemaGql: item.schemaGql,
            searchFieldName: params.searchField,
            targetSchema: params.schemaName,
            triggerPathsToFields: item.pathsToFields || [],
            schemaName: item.schemaName,
        })))

    return (schemaType, schemaName, schema) => {
        const params = searchFieldsParameters.find((item) => item.schemaName === schemaName)
        if (params) {
            console.log(' ---> addSearchField', schemaName)
            const pathsToSimpleFields = get(params, 'simpleFields.pathsToFields', [])
            const pathsToRelatedFields = allRelatedFields.filter((item) => item.targetSchema).flatMap((item) => item.triggerPathsToFields)
            const preprocessorsForFields = get(params, 'simpleFields.preprocessorsForFields')
            return addSearchField({
                searchField: params.searchField,
                pathsToFields: [...pathsToSimpleFields, ...pathsToRelatedFields],
                preprocessorsForFields,
            })(schema)
        }

        const relatedData = allRelatedFields.filter((item) => item.schemaName === schemaName)
        if (!isEmpty(relatedData)) {
            console.log(' ---> addSearchUpdateTrigger', schemaName)
            return addSearchUpdateTrigger(relatedData)(schema)
        }

        return schema
    }
}

module.exports = {
    searchFieldPreprocessor,
}
