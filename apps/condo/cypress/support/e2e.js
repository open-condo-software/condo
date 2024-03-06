import './commands'

Cypress.on('uncaught:exception', (err) => {
    if (err.message.toLowerCase().includes('resizeobserver')) {
        return false
    }
})

const prepareTestEnvironment = () => {
    cy.viewport('macbook-13')
}

beforeEach(prepareTestEnvironment)
