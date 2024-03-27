const { faker } = require('@faker-js/faker')

const { getReqParam, getReqJson } = require('@address-service/domains/common/utils/services/requestHelper')

describe('requestHelper', () => {
    describe('data from body (POST)', () => {
        it('should return parameter value if exist', () => {
            const body = { param: faker.random.word() }
            const value = getReqParam({ body }, 'param', 'someDefault')
            expect(value).toBe(body.param)
        })

        it('should return default value if parameter not exist', () => {
            const body = { param: faker.random.word() }
            const defaultValue = faker.random.word()
            const value = getReqParam({ body }, 'param-pam-pam', defaultValue)
            expect(value).toBe(defaultValue)
        })

        it('should return json parameter value if exist', () => {
            const jsonParam = { param: faker.random.word() }
            const body = { jsonParam: JSON.stringify(jsonParam) }
            const value = getReqJson({ body }, 'jsonParam', { param: 'someDefault' })
            expect(value).toEqual(jsonParam)
        })

        it('should return default json value if parameter not exist', () => {
            const jsonParam = { param: faker.random.word() }
            const body = { jsonParam: JSON.stringify(jsonParam) }
            const defaultValue = { param: faker.random.word() }
            const value = getReqJson({ body }, 'jsonParam-pam-pam', defaultValue)
            expect(value).toEqual(defaultValue)
        })
    })

    describe('data from query (GET)', () => {
        it('should return parameter value if exist', () => {
            const query = { param: faker.random.word() }
            const value = getReqParam({ query }, 'param', 'someDefault')
            expect(value).toBe(query.param)
        })

        it('should return default value if parameter not exist', () => {
            const query = { param: faker.random.word() }
            const defaultValue = faker.random.word()
            const value = getReqParam({ query }, 'param-pam-pam', defaultValue)
            expect(value).toBe(defaultValue)
        })

        it('should return json parameter value if exist', () => {
            const jsonParam = { param: faker.random.word() }
            const query = { jsonParam: JSON.stringify(jsonParam) }
            const value = getReqJson({ query }, 'jsonParam', { param: 'someDefault' })
            expect(value).toEqual(jsonParam)
        })

        it('should return default json value if parameter not exist', () => {
            const jsonParam = { param: faker.random.word() }
            const query = { jsonParam: JSON.stringify(jsonParam) }
            const defaultValue = { param: faker.random.word() }
            const value = getReqJson({ query }, 'jsonParam-pam-pam', defaultValue)
            expect(value).toEqual(defaultValue)
        })
    })

    it('body params has higher priority the query params (POST with GET-parameters)', () => {
        const body = { param: faker.random.word() }
        const query = { param: faker.random.word() }
        const defaultValue = faker.random.word()
        const value = getReqParam({ body, query }, 'param', defaultValue)
        expect(value).toBe(body.param)
    })
})
