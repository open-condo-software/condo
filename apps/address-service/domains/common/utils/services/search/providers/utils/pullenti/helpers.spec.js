const { joinNameAndType, selfOrFirst, getGarLevel, getGarParam, extractLastFiasId, extractLastGarParam } = require('./helpers')

describe('helpers', () => {
    describe('joinNameAndType', () => {
        it('should join name and type with space when isNameFirst is true', () => {
            expect(joinNameAndType('name', 'type')).toBe('name type')
            expect(joinNameAndType('name', 'type', true)).toBe('name type')
        })

        it('should join type and name with space when isNameFirst is false', () => {
            expect(joinNameAndType('name', 'type', false)).toBe('type name')
        })

        it('should handle empty strings', () => {
            expect(joinNameAndType('', 'type')).toBe('')
            expect(joinNameAndType('name', '')).toBe('')
            expect(joinNameAndType('', '', true)).toBe('')
        })
    })

    describe('selfOrFirst', () => {
        it('should return first element of array', () => {
            expect(selfOrFirst([1, 2, 3])).toBe(1)
            expect(selfOrFirst(['a', 'b'])).toBe('a')
        })

        it('should return object itself if not array', () => {
            const obj = { key: 'value' }
            expect(selfOrFirst(obj)).toBe(obj)
        })

        it('should handle empty array', () => {
            expect(selfOrFirst([])).toBe(undefined)
        })
    })

    describe('getGarLevel', () => {
        const garData = [
            { level: 1, value: 'first' },
            { level: 2, value: 'second' },
            { level: 3, value: 'third' },
        ]

        it('should return object with matching level', () => {
            expect(getGarLevel(garData, 2)).toEqual({ level: 2, value: 'second' })
        })

        it('should return first element when level not found', () => {
            expect(getGarLevel(garData, 5)).toEqual({ level: 1, value: 'first' })
        })

        it('should return first element when level is null', () => {
            expect(getGarLevel(garData)).toEqual({ level: 1, value: 'first' })
        })

        it('should return object itself if not array', () => {
            const singleGar = { level: 1, value: 'single' }
            expect(getGarLevel(singleGar, 2)).toEqual(singleGar)
        })

        it('should handle null/undefined levelGar input', () => {
            expect(getGarLevel(null)).toBeNull()
            expect(getGarLevel(undefined)).toBeUndefined()
        })
    })

    describe('getGarParam', () => {
        const garObject = {
            param: [
                { '@_name': 'type', '#text': 'street' },
                { '@_name': 'code', '#text': '123' },
            ],
        }

        it('should return param value by name', () => {
            expect(getGarParam(garObject, 'type')).toBe('street')
            expect(getGarParam(garObject, 'code')).toBe('123')
        })

        it('should return undefined for non-existing param', () => {
            expect(getGarParam(garObject, 'missing')).toBeUndefined()
        })

        it('should handle undefined/null gar object', () => {
            expect(getGarParam(null, 'type')).toBeUndefined()
            expect(getGarParam(undefined, 'type')).toBeUndefined()
        })

        it('should handle gar object without params', () => {
            expect(getGarParam({}, 'type')).toBeUndefined()
        })
    })

    describe('extractLastFiasId', () => {
        it('should return null for empty array', () => {
            expect(extractLastFiasId([])).toBeNull()
        })

        it('should return null for undefined input', () => {
            expect(extractLastFiasId()).toBeNull()
        })

        it('should return null when no gar guids present', () => {
            const textobj = [
                { someField: 'value' },
                { gar: { someField: 'value' } },
                { gar: { guid: null } },
            ]
            expect(extractLastFiasId(textobj)).toBeNull()
        })

        it('should return the last valid guid from the array', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { gar: { guid: '456' } },
                { gar: { guid: '789' } },
            ]
            expect(extractLastFiasId(textobj)).toBe('789')
        })

        it('should handle mixed valid and invalid guids', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { someField: 'value' },
                { gar: { guid: '456' } },
                { gar: { someField: 'value' } },
            ]
            expect(extractLastFiasId(textobj)).toBe('456')
        })

        it('should keep previous value if current guid is empty', () => {
            const textobj = [
                { gar: { guid: '123' } },
                { gar: { guid: '' } },
                { gar: { guid: null } },
                { gar: { guid: undefined } },
            ]
            expect(extractLastFiasId(textobj)).toBe('123')
        })
    })

    describe('extractLastParam', () => {
        it('should return null for empty array', () => {
            expect(extractLastGarParam([], 'kladrcode')).toBeNull()
        })

        it('should return null when no parameters present', () => {
            const textobj = [
                { someField: 'value' },
                { gar: { someField: 'value' } },
                { gar: { param: [] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBeNull()
        })

        it('should return the last valid parameter value from the array', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1234567890' }] } },
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '0987654321' }] } },
                { gar: { param: [{ '@_name': 'kladrcode', '#text': '1122334455' }] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('1122334455')
        })

        it('should return the last valid okato value', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'okato', '#text': '1234' }] } },
                { gar: { param: [{ '@_name': 'okato', '#text': '5678' }] } },
            ]
            expect(extractLastGarParam(textobj, 'okato')).toBe('5678')
        })

        it('should return the last valid oktmo value', () => {
            const textobj = [
                { gar: { param: [{ '@_name': 'oktmo', '#text': '87654321' }] } },
                { gar: { param: [{ '@_name': 'oktmo', '#text': '12345678' }] } },
            ]
            expect(extractLastGarParam(textobj, 'oktmo')).toBe('12345678')
        })

        it('should handle mixed parameters', () => {
            const textobj = [
                { gar: { param: [
                    { '@_name': 'kladrcode', '#text': '1234567890' },
                    { '@_name': 'okato', '#text': '1234' },
                ] } },
                { gar: { param: [
                    { '@_name': 'oktmo', '#text': '87654321' },
                    { '@_name': 'kladrcode', '#text': '0987654321' },
                ] } },
            ]
            expect(extractLastGarParam(textobj, 'kladrcode')).toBe('0987654321')
            expect(extractLastGarParam(textobj, 'okato')).toBe('1234')
            expect(extractLastGarParam(textobj, 'oktmo')).toBe('87654321')
        })
    })
})
