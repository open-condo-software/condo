
const { faker } = require('@faker-js/faker')

const { makeSessionData } = require('@condo/domains/common/utils/session')

describe('session', () => {
    
    describe('makeSessionData', () => {
        
        describe('organizations', () => {
            
            it('not provided', () => {
                const sessionData = makeSessionData()
                expect(sessionData.organizations).toBeNull()
            })
            
            it('provided nulls', () => {
                const sessionData = makeSessionData({ organizations: [null, null] })
                expect(sessionData.organizations).toHaveLength(0)
            })
            
            it('providedDuplicates', () => {
                const organizationId = faker.datatype.uuid()
                const sessionData = makeSessionData({ organizations: [organizationId, organizationId, organizationId] })
                expect(sessionData.organizations).toEqual([organizationId])
            })
            
        })
        
        describe('b2bPermissionKeys', () => {
            
            it('not provided', () => {
                const sessionData = makeSessionData()
                expect(sessionData.b2bPermissionKeys).toBeNull()
            })
            
            it('provided null', () => {
                const sessionData = makeSessionData({ b2bPermissionKeys: null })
                expect(sessionData.b2bPermissionKeys).toBeNull()
            })
            
            it('providedDuplicates', () => {
                const permissionKey = 'canDoOneThing'
                const sessionData = makeSessionData({ b2bPermissionKeys: [permissionKey, permissionKey, permissionKey] })
                expect(sessionData.b2bPermissionKeys).toEqual([permissionKey])
            })
            
            it('populates from truth right set keys', () => {
                const rightSet = {
                    canDoOneThing: true,
                    canDoOtherThing: false,
                }
                const sessionData = makeSessionData({ b2bPermissions: rightSet })
                expect(sessionData.b2bPermissionKeys).toEqual(['canDoOneThing'])
            })
            
            it('append keys from right set', () => {
                const rightSet = {
                    canDoOneThing: true,
                    canDoOtherThing: false,
                }
                const permissionKey = 'canDoThirdThing'
                const sessionData = makeSessionData({ b2bPermissionKeys: [permissionKey], b2bPermissions: rightSet })
                expect(sessionData.b2bPermissionKeys).toHaveLength(2)
                expect(sessionData.b2bPermissionKeys).toEqual(expect.arrayContaining(['canDoOneThing', 'canDoThirdThing']))
            })
            
        })
        
    })
    
})