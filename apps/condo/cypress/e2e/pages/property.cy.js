import { authUserWithCookies } from '../../plugins/auth'
import { PropertyCreate } from '../../objects/Property'

describe('Property', function () {
    describe('User', function () {
        afterEach(() => {
            cy.clearCookies()
        })

        it('can create property map', () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)

                const propertyCreate = new PropertyCreate()
                propertyCreate
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
    })
})
