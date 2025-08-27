describe('캘린더 E2E 테스트', () => {
  beforeEach(() => {
    cy.clock(new Date('2025-08-01T10:00:00'));
    cy.visit('/');
  });

  it('사용자가 새 일정을 성공적으로 추가하고 캘린더에서 확인할 수 있다', () => {
    const eventTitle = 'Cypress로 추가한 새 일정';

    cy.get('button').contains('일정 추가').click();

    cy.get('#title').type(eventTitle);
    cy.get('#date').type('2025-08-10');
    cy.get('#start-time').type('10:00');
    cy.get('#end-time').type('11:00');
    cy.get('#description').type('Cypress 테스트');
    cy.get('#location').type('Cypress 테스트');

    cy.get('[data-testid="event-submit-button"]').click();

    cy.get('[data-testid="month-view"]').should('contain', eventTitle);

    cy.get('[data-testid="event-list"]').should('contain', eventTitle);
  });
});
