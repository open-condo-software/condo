
const { faker } = require('@faker-js/faker')

const { makeSessionData } = require('@condo/domains/common/utils/session')

describe('session', () => {
    
    describe('makeSessionData', () => {
        
        describe('organizations', () => {
            
            it('not provided', () => {
                const sessionData = makeSessionData()
                expect(sessionData.allowedOrganizations).toBe(true)
            })
            
            it('provided nulls', () => {
                const sessionData = makeSessionData({ allowedOrganizations: [null, null] })
                expect(sessionData.allowedOrganizations).toHaveLength(0)
            })
            
            it('providedDuplicates', () => {
                const organizationId = faker.datatype.uuid()
                const sessionData = makeSessionData({ allowedOrganizations: [organizationId, organizationId, organizationId] })
                expect(sessionData.allowedOrganizations).toEqual([organizationId])
            })
            
        })
        
        describe('b2bPermissionKeys', () => {
            
            it('not provided', () => {
                const sessionData = makeSessionData()
                expect(sessionData.enabledB2BPermissions).toBe(true)
            })
            
            it('provided null', () => {
                const sessionData = makeSessionData({ enabledB2BPermissions: null })
                expect(sessionData.enabledB2BPermissions).toBe(true)
            })
            
            it('providedDuplicates', () => {
                const permissionKey = 'canDoOneThing'
                const sessionData = makeSessionData({ enabledB2BPermissions: [permissionKey, permissionKey, permissionKey] })
                expect(sessionData.enabledB2BPermissions).toEqual([permissionKey])
            })
            
        })
        
    })
    
})