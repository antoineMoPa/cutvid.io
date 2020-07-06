Cypress.Commands.add('login', (userType, options = {}) => {
  cy.visit('http://127.0.0.1:8888/app');
  cy.contains('Sign in').click();
  cy.get('.auth-iframe').should('be.visible');

  const get_iframe = () => {
    return cy.get('.auth-iframe')
      .its('0.contentDocument.body').should('not.be.empty')
      .then(cy.wrap);
  };

  get_iframe().find('#user_email').type('cypress-test@example.com');
  get_iframe().find('#user_password').type('password');
  get_iframe().contains('input', 'Log in').click();

  cy.get('.auth-iframe').parent().find('.close-button').click();
});

describe('User account', () => {

  it('Creates a user account', () => {
    cy.visit('http://127.0.0.1:8888/app');
    cy.contains('Sign in').click();
    cy.get('.auth-iframe').should('be.visible');

    const get_iframe = () => {
      return cy.get('.auth-iframe')
        .its('0.contentDocument.body').should('not.be.empty')
        .then(cy.wrap);
    };

    get_iframe().find('.sign-up-button').click();

    cy.wait(1);

    get_iframe().find('#user_password_confirmation').should('be.visible');

    cy.wait(1);

    get_iframe().find('#user_email').type('cypress-test@example.com');
    get_iframe().find('#user_password').type('password');
    get_iframe().find('#user_password_confirmation').type('password');
    get_iframe().contains('Sign up').click();
  });


  it('Logs a user in', () => {
    cy.login();
    cy.contains('signed in').should('be.visible');
  });
})
