import { authUserWithCookies } from '../../plugins/auth'
import { PropertyMapCreate, PropertyMapEdit } from '../../objects/Property'

describe('Property', function () {
    describe('User', function () {
        afterEach(() => {
            cy.clearCookies()
        })

        it('can create property map', () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)

                const propertyMapCreate = new PropertyMapCreate()
                propertyMapCreate
                    .visit()
                    .clickOnPropertyTableRow()
                    .clickEditPropertyMapButton()
                    .clickSection()
                    .clickRemoveSection()
                    .clickOnEditMenu()
                    .clickEditSection()
                    .typeFloorCount()
                    .typeUnitsOnFloorCount()
                    .clickSubmitButton()
            })
        })

        it('can edit property map', () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)

                const propertyMapEdit = new PropertyMapEdit()
                propertyMapEdit
                    .visit()
                    .clickOnPropertyTableRow()
                    .clickEditPropertyMapButton()
                    .cleanUp()
                    .createTestSection()
                    .clickOnEditMenu()
                    .clickEditSection()
                    .clickSectionEditMode()
                    .clickSubmitButton()
            })
        })
    })
})
