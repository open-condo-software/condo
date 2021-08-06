/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

class SignInPage {

    static url = 'http://localhost:3000/auth/signin/'

    visit () {
        cy.visit(SignInPage.url)
    }

    fillPhone (value) {
        const field = cy.get('[data-ci=signin-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-ci=signin-password-item] input')
        field.clear()
        field.type(value)

        return this
    }

    submit () {
        const button = cy.get('[data-ci=signin-button]')
        button.click()
    }
}

export default SignInPage
