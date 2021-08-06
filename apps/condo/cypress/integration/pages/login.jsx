/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

import HomePage from '../../objects/HomePage'
import SignInPage from '../../objects/SignInPage'
import RegistrationPage from '../../objects/RegistrationPage'

describe('Sign In new user', () => {
    it('Register', () => {
        cy.fixture('user.json').then(user => {
            const registration = new RegistrationPage()
            registration.visit()
            registration
                .fillPhone(user.phone)
                .submit()
            registration
                .fillSMSCode(user.sms)
            registration
                .fillFIO(user.name)
                .fillEmail(user.email)
                .fillPass(user.password)
                .fillPass2(user.password)
                .submit_second()
            cy.url().should('eq', HomePage.url)
        })
    })


    it('Sign In', () => {
        cy.fixture('user.json').then(user => {
            const signIn = new SignInPage()
            signIn.visit()
            signIn
                .fillPhone(user.phone)
                .fillPassword(user.password)
                .submit()
            cy.url().should('eq', HomePage.url)
        })
    })
})

// it('Auto transition to the authorization page', () => {
//   const home = new HomePage();
//   home.visit();
//   cy.url({ timeout: 10000 }).should('include', '/auth/signin',)
// });

// it('Empty Phone', () => {
//   cy.fixture('user.json').then(user => {
//     const signIn = new SignInPage();
//     signIn.visit()
//     signIn
//       .fillPhone("+7")
//       .fillPassword(user.password)
//       .submit()
//     signIn.getPhoneError()
//   })
// })

// it('Empty Password', () => {
//   cy.fixture('user.json').then(user => {
//     const signIn = new SignInPage();
//     signIn.visit()
//     signIn
//       .fillPhone(user.phone)
//       .fillPassword(" ")
//       .submit()
//     signIn.getPasswordError()
//   })
// })

// it('Wrong Password', () => {
//   cy.fixture('user.json').then(user => {
//     const signIn = new SignInPage();
//     signIn.visit()
//     signIn
//       .fillPhone(user.phone)
//       .fillPassword(user.password + "wrong")
//       .submit()
//     signIn.getPasswordError()
//   })
// })
