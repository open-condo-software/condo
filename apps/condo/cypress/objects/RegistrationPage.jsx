/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

class RegistrationPage {

    static url = 'http://localhost:3000/auth/register/'

    visit () {
        cy.visit(RegistrationPage.url)
    }

    fillPhone (value) {
        const field = cy.get('[data-ci=register-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillSMSCode (value) {
        const field = cy.get('[data-ci=register-smscode-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillFIO (value) {
        const field = cy.get('[data-ci=register-name-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillEmail (value) {
        const field = cy.get('[data-ci=register-email-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPass (value) {
        const field = cy.get('[data-ci=register-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPass2 (value) {
        const field = cy.get('[data-ci=register-confirmpassword-item] input')
        field.clear()
        field.type(value)
        return this
    }

    submit () {
        const button = cy.get('[data-ci=register-button]')
        button.click()
    }

    submit_second () {
        const button = cy.get('[data-ci=registercomplete-button]')
        button.click()
    }
}

export default RegistrationPage
