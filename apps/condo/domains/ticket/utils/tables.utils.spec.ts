import { getTicketAttributesFilter } from '@condo/domains/ticket/utils/tables.utils'

describe('Table utils', () => {
    describe('getTicketAttributesFilter', () => {
        const isEmergencyAttribute = 'isEmergency'
        const isPaidAttribute = 'isPaid'
        const isWarrantyAttribute = 'isWarranty'
        const filterAttribute = getTicketAttributesFilter([isEmergencyAttribute, isPaidAttribute, isWarrantyAttribute])

        it('should return filter query with one search argument', () => {
            const result = filterAttribute(isEmergencyAttribute)

            expect(result).toBeDefined()
            expect(result).toStrictEqual({ OR: [ { [isEmergencyAttribute]: true } ] })
        })

        it('should return filter query with two search argument', () => {
            const result = filterAttribute([isEmergencyAttribute, isPaidAttribute])

            expect(result).toBeDefined()
            expect(result).toStrictEqual({ OR: [ { [isEmergencyAttribute]: true }, { [isPaidAttribute]: true } ] })
        })

        it('should return filter query with three search argument', () => {
            const result = filterAttribute([isEmergencyAttribute, isPaidAttribute, isWarrantyAttribute])

            expect(result).toBeDefined()
            expect(result).toStrictEqual({ OR: [ { [isEmergencyAttribute]: true }, { [isPaidAttribute]: true }, { [isWarrantyAttribute]: true } ] })
        })

        it('should return undefined with wrong search argument', () => {
            const result = filterAttribute('')

            expect(result).toBeUndefined()
        })
    })
})