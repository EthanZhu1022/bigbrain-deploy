describe('Register Page E2E', () => {
  beforeEach(() => {
    cy.visit('https://z5610836-bigbrain-fe-deploy.vercel.app/register'); // Update path if needed
  });

  it('Registers a new user successfully', () => {
    const name = 'Test User';
    const email = `testuser_${Date.now()}@example.com`; // Unique email
    const password = 'Password123!';
    const gamename = 'Addition';

    cy.get('input[type="text"]').type(name);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').eq(0).type(password); // Password
    cy.get('input[type="password"]').eq(1).type(password); // Confirm Password

    cy.get('button[type="submit"]').click();

    expect(cy.location('pathname').should('eq', '/dashboard'));

    cy.contains('button', 'Create New Game').click();
    cy.get('.modal input[type="text"]').type(gamename);
    cy.get('[data-testid="create-game-button"]',{timeout: 5000}).click();


    // Wait for new game to appear
    cy.contains('.card-title', gamename, { timeout: 5000 }).should('exist');

    // Click game card to edit
    cy.contains('.card-title', gamename)
      .parents('.card')
      .find('.card-body')
      .click({ force: true });

    cy.contains('label', 'Thumbnail')
      .parent()
      .find('input')
      .type('https://mir-s3-cdn-cf.behance.net/project_modules/1400/50627a175474311.64b4b17cb24b3.jpg');
    
    cy.contains('button', 'Save Game Info').click();
    const q1 ='2+2';
    const a1 ='4'
    const a2 ='5'
    cy.contains('Add New Question').click();
    cy.contains('label', 'Question Text')
      .parent()
      .find('input')
      .type(q1);

    cy.get('input[placeholder="Answer 1"]').clear().type(a1);
    cy.get('input[placeholder="Answer 2"]').clear().type(a2);
  
      // Check the "Correct" checkbox for the first answer
    cy.get('input[type="checkbox"]').eq(0).check();
    cy.contains('button', 'Create Question').click();

    cy.contains('Add New Question').click();
    cy.contains('label', 'Question Text')
      .parent()
      .find('input')
      .type(q1);

    cy.get('input[placeholder="Answer 1"]').clear().type(a1);
    cy.get('input[placeholder="Answer 2"]').clear().type(a2);
  
      // Check the "Correct" checkbox for the first answer
    cy.get('input[type="checkbox"]').eq(0).check();
    cy.contains('button', 'Create Question').click();

    cy.contains('Add New Question').click();
    cy.contains('label', 'Question Text')
      .parent()
      .find('input')
      .type(q1);

    cy.get('input[placeholder="Answer 1"]').clear().type(a1);
    cy.get('input[placeholder="Answer 2"]').clear().type(a2);
  
      // Check the "Correct" checkbox for the first answer
    cy.get('input[type="checkbox"]').eq(0).check();
    cy.contains('button', 'Create Question').click();

    cy.contains('button', 'Save Game Info').click();
    cy.contains('button', 'Back').click();

    cy.contains('.card-title', gamename, { timeout: 5000 }).should('exist');
    cy.contains('button', 'Del').click();
    // Logout
    cy.contains('button', 'Logout').click({ force: true });

    // Log back in
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').eq(0).type(password);
    cy.get('button[type=submit]').click();
    cy.location('pathname').should('eq', '/dashboard');
  });
});
