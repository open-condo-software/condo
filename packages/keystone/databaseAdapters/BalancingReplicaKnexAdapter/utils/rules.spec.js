const { faker } = require('@faker-js/faker')

const { isRuleMatching } = require('./rules')

const SQL_CRUD_OPERATIONS = ['insert', 'select', 'update', 'delete']

function _generateCombinations (options) {
    const keys = Object.keys(options)
    const total = Object.values(options).map(variants => variants.length).reduce((acc, cur) => acc * cur, 1)

    const combinations = []

    for (let i = 0; i < total; i++) {
        let left = i
        let spaceSize = total
        const combination = {}

        for (const key of keys) {
            const optionSize = spaceSize / options[key].length
            const option = Math.floor(left / optionSize)
            combination[key] = options[key][option]
            spaceSize = optionSize
            left -= option * optionSize
        }

        combinations.push(combination)
    }

    return combinations
}

function _randomInt (max) {
    return Math.floor(Math.random() * max)
}

function _buildRuleValue (value, ruleType) {
    if (ruleType === 'string-match') {
        return [value, true]
    } else if (ruleType === 'string-wrong') {
        return [faker.random.alphaNumeric(10), false]
    } else if (ruleType === 'regexp-match') {
        const randomLength = _randomInt(value.length - 1) + 1 // [1, value.length)
        const fromEnd = Math.random() > 0.5
        const pattern = fromEnd
            // NOTE: controlled tests environment
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            ? new RegExp(`^.+${value.substring(value.length - randomLength)}$`)
            // NOTE: controlled tests environment
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            : new RegExp(`^${value.substring(0, randomLength)}.+$`)
        return [pattern, true]
    } else {
        return [new RegExp(faker.random.alphaNumeric(10)), false]
    }
}

function _buildTestExample (combination, partialContext) {
    const gqlOperationName = faker.random.alphaNumeric(16)
    const sqlIndex = _randomInt(0, SQL_CRUD_OPERATIONS.length)
    const tableName = faker.random.alphaNumeric(16)

    const ctx = {
        gqlOperationType: combination.gqlOperationType,
        gqlOperationName,
        sqlOperationName: SQL_CRUD_OPERATIONS[sqlIndex],
        tableName,
        ...partialContext,
    }

    let shouldMatch = true

    const rule = {
        target: faker.random.alphaNumeric(),
    }

    if (combination.filterByGqlType) {
        rule.gqlOperationType = combination.filterByGqlType
        shouldMatch = shouldMatch && rule.gqlOperationType === ctx.gqlOperationType
    }

    if (combination.filterByGqlName) {
        const [ruleValue, expectedMatch] = _buildRuleValue(ctx.gqlOperationName, combination.filterByGqlName)
        rule.gqlOperationName = ruleValue
        shouldMatch = shouldMatch && expectedMatch
    }

    if (combination.filterBySqlName) {
        if (combination.filterBySqlName === 'string-match') {
            rule.sqlOperationName = ctx.sqlOperationName
        } else {
            const nonMatchingOperations = SQL_CRUD_OPERATIONS.filter((name) => name !== ctx.sqlOperationName)
            const randomIndex = _randomInt(nonMatchingOperations.length)
            rule.sqlOperationName = nonMatchingOperations[randomIndex]
            shouldMatch = false
        }
    }

    if (combination.filterByTableName) {
        const [ruleValue, expectedMatch] = _buildRuleValue(ctx.tableName, combination.filterByTableName)
        rule.tableName = ruleValue
        shouldMatch = shouldMatch && expectedMatch
    }


    return [rule, ctx, shouldMatch]
}

describe('isRuleMatching', () => {
    describe('Must return correct result on full context', () => {
        const cases = _generateCombinations({
            gqlOperationType: ['query', 'mutation'],
            filterByGqlType: [undefined, 'query', 'mutation'],
            filterByGqlName: [undefined, 'string-match', 'regexp-match', 'string-wrong', 'regexp-wrong'],
            filterBySqlName: [undefined, 'string-match', 'string-wrong'],
            filterByTableName: [undefined, 'string-match', 'regexp-match', 'string-wrong', 'regexp-wrong'],
        })

        test.each(cases)('%p', (combination) => {
            const [rule, ctx, shouldMatch] = _buildTestExample(combination)

            expect(isRuleMatching(rule, ctx)).toEqual(shouldMatch)
        })
    })
    describe('Must return correct result on SQL-only context (direct adapter calls)', () => {
        const cases = _generateCombinations({
            filterByGqlType: [undefined, 'query', 'mutation'],
            filterByGqlName: [undefined, 'string-wrong', 'regexp-wrong'],
            filterBySqlName: [undefined, 'string-match', 'string-wrong'],
            filterByTableName: [undefined, 'string-match', 'regexp-match', 'string-wrong', 'regexp-wrong'],
        })

        test.each(cases)('%p', (combination) => {
            const [rule, ctx, shouldMatch] = _buildTestExample(
                combination,
                {
                    gqlOperationType: undefined,
                    gqlOperationName: undefined,
                }
            )

            expect(isRuleMatching(rule, ctx)).toEqual(shouldMatch)
        })
    })
    describe('Must return correct result on partial SQL-only context (internal KS calls)', () => {
        const cases = _generateCombinations({
            filterByGqlType: [undefined, 'query', 'mutation'],
            filterByGqlName: [undefined, 'string-wrong', 'regexp-wrong'],
            filterBySqlName: [undefined, 'string-match', 'string-wrong'],
            filterByTableName: [undefined, 'string-wrong', 'regexp-wrong'],
        })

        test.each(cases)('%p', (combination) => {
            const [rule, ctx, shouldMatch] = _buildTestExample(
                combination,
                {
                    sqlOperationName: 'show',
                    tableName: undefined,
                    gqlOperationType: undefined,
                    gqlOperationName: undefined,
                }
            )

            expect(isRuleMatching(rule, ctx)).toEqual(shouldMatch)
        })
    })
})