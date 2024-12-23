
const {
    getPermissionsDiff,
    getPermissionsWithValue,
    getEnabledPermissions,
    getDisabledPermissions,
} = require('./permissions')

describe('Permission Helper Functions', () => {
    describe('getPermissionsDiff', () => {
        it('skips fields, not defined in right set config', () => {
            const rightSet = {
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            const referenceRightSet = {
                canReadContacts2: true,
                ...rightSet,
            }
            const inspectedRightSet = {
                canReadContacts2: false,
                ...rightSet,
            }
            expect(getPermissionsDiff(referenceRightSet, inspectedRightSet)).toEqual({})
        })

        it('should return an empty object if there are no differences', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsDiff(b2bAppAccessRightSet, b2bAppAccessRightSet)).toEqual({})
        })

        it('should return an object with differences', () => {
            const referenceRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            const inspectedRightSet = {
                canReadContacts: false,
                canManageContacts: true,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsDiff(referenceRightSet, inspectedRightSet)).toEqual({
                canReadContacts: false,
                canManageContacts: true,
            })
        })

        it('should handle cases where the left object is empty', () => {
            const referenceRightSet = {}
            const inspectedRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsDiff(referenceRightSet, inspectedRightSet)).toEqual(inspectedRightSet)
        })

        it('should handle cases where the right object is empty', () => {
            const referenceRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            const inspectedRightSet = {}

            expect(getPermissionsDiff(referenceRightSet, inspectedRightSet)).toEqual({})
        })
    })

    describe('getPermissionsWithValue', () => {
        it('should return an object with permissions with the specified value (true)', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsWithValue(b2bAppAccessRightSet, true)).toEqual({
                canReadContacts: true,
                canReadMeters: true,
            })
        })

        it('should return an object with permissions with the specified value (false)', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsWithValue(b2bAppAccessRightSet, false)).toEqual({
                canManageContacts: false,
                canManageMeters: false,
            })
        })

        it('should return an empty object if no permissions match the value', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getPermissionsWithValue(b2bAppAccessRightSet, 'some_value')).toEqual({})
        })

        it('should handle empty access right set', () => {
            expect(getPermissionsWithValue({}, true)).toEqual({})
        })
    })

    describe('getEnabledPermissions', () => {
        it('should return an object with enabled permissions', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getEnabledPermissions(b2bAppAccessRightSet)).toEqual({
                canReadContacts: true,
                canReadMeters: true,
            })
        })

        it('should return empty object if there is no enabled permissions', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: false,
                canManageContacts: false,
                canReadMeters: false,
                canManageMeters: false,
            }
            expect(getEnabledPermissions(b2bAppAccessRightSet)).toEqual({})
        })
        it('should handle empty access right set', () => {
            expect(getEnabledPermissions({})).toEqual({})
        })
    })

    describe('getDisabledPermissions', () => {
        it('should return an object with disabled permissions', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: false,
                canReadMeters: true,
                canManageMeters: false,
            }
            expect(getDisabledPermissions(b2bAppAccessRightSet)).toEqual({
                canManageContacts: false,
                canManageMeters: false,
            })
        })

        it('should return empty object if there is no disabled permissions', () => {
            const b2bAppAccessRightSet = {
                canReadContacts: true,
                canManageContacts: true,
                canReadMeters: true,
                canManageMeters: true,
            }
            expect(getDisabledPermissions(b2bAppAccessRightSet)).toEqual({})
        })

        it('should handle empty access right set', () => {
            expect(getDisabledPermissions({})).toEqual({})
        })
    })
})
