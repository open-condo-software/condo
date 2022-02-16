import faker from 'faker'
import { SignIn } from '../objects/Auth'
import { TicketCreate, TicketEdit, TicketView } from '../objects/Ticket'
import times from 'lodash/times'

describe('loadTest', () => {
    const userPhone = cy.config('rawJson').env.user_phone
    const userSecret = cy.config('rawJson').env.user_secret

    times(cy.config('rawJson').env.loadTestRunTimes, () => {
        it('should pass user scenario', () => {

            const signIn = new SignIn()
            signIn
                .visit()
                .fillPhone(userPhone)
                .fillPassword(userSecret)
                .signinClick()
                .chooseOrganization()

            const ticketCreate = new TicketCreate()
            ticketCreate
                .visit()
                .clickAndInputAddress('ленина')
                .chooseAddressForTicket()
                .clickAndInputUnitName(faker.datatype.number({
                    min: 1, max: 10,
                }))
                .chooseUnitName()
                .clickAndInputDescription(faker.lorem.sentence(3))
                .selectProblemWithCategoryClassifier()
                .clickOnSubmitButton()

            const ticketView = new TicketView()
            ticketView
                .uploadExcel()
                .visit()
                .clickIsWarrantyCheckbox()
                .clickIsPaidCheckbox()
                .clickIsEmergencyCheckbox()
                .clickOnGlobalFiltersButton()
                .typeAddressSearchInput('ленина')

            const ticketEdit = new TicketEdit()
            ticketEdit
                .visitNoReload()
                .changeTicketStatus()
                .clickUpdateTicketLink()
                .clickTicketDeadline()
                .clickApplyChanges()

            cy.clearCookies()
        })
    })
})


//yarn workspace @app/condo cypress run -C ./cypress/cypress.json -s ./cypress/integration/loadTest.js -b chrome
