/// <reference types="cypress" />

const createEvent = (eventData) => {
  const { title, date, startTime, endTime, description, location } = eventData;

  cy.get('#title').type(title);
  cy.get('#date').type(date);
  cy.get('#start-time').type(startTime);
  cy.get('#description').type(description);
  cy.get('#location').type(location);
  cy.get('#end-time').type(endTime);
  cy.get('[data-testid="event-submit-button"]').click({ force: true });
};

const createRecurringEvent = (eventData) => {
  const { title, date, startTime, endTime, description, location, repeat } = eventData;

  cy.get('#title').type(title);
  cy.get('#date').type(date);
  cy.get('#start-time').type(startTime);
  cy.get('#description').type(description);
  cy.get('#location').type(location);
  cy.get('#end-time').type(endTime);

  if (repeat && repeat.type !== 'none') {
    cy.get('input[type="checkbox"]').check();
    cy.get('#repeat-end').should('be.visible').and('be.enabled');

    cy.get('#repeat-type-select').click();

    cy.get(`[data-value="${repeat.type}"]`).click();

    if (repeat.endDate) {
      cy.get('#repeat-end').type(repeat.endDate, { force: true });
    }
  }
  cy.get('[data-testid="event-submit-button"]').click({ force: true });
};

describe('캘린더 E2E 테스트', () => {
  beforeEach(() => {
    cy.clock(new Date('2025-08-01T10:00:00'));
    cy.visit('/');
  });

  describe('1. 기본 CRUD (Create, Read, Update, Delete)', () => {
    beforeEach(() => {
      cy.clock(new Date('2025-08-01T10:00:00'));
      cy.visit('/');
    });
    it('시나리오: 사용자가 새 단일 일정을 성공적으로 생성한다', () => {
      const eventTitle = '새로운 E2E 테스트 일정';

      // Given: 일정 추가 폼이 있고
      // When: 모든 필드를 유효하게 채운 뒤 저장한다.
      cy.get('#title').type(eventTitle);
      cy.get('#date').type('2025-08-15');
      cy.get('#start-time').type('14:00');
      cy.get('#end-time').type('15:00');
      cy.get('#description').type('테스트 내용');
      cy.get('#location').type('테스트 장소');
      cy.get('[data-testid="event-submit-button"]').click();

      // Then: '일정이 추가되었습니다' 알림이 나타나야 한다.
      // cy.contains('일정이 추가되었습니다').should('be.visible');

      // And: 캘린더와 오른쪽 이벤트 목록에 새로운 일정이 표시되어야 한다.
      cy.get('[data-testid="month-view"]').should('contain', eventTitle);
      cy.get('[data-testid="event-list"]').should('contain', eventTitle);
    });

    it('시나리오: 사용자가 기존 일정을 성공적으로 수정한다', () => {
      const updatedTitle = '수정된 E2E 테스트 일정';

      // Given: 초기 일정이 화면에 표시된 상태에서,
      // When: 오른쪽 목록에서 특정 일정의 '수정' 버튼을 누르고,
      cy.get('[data-testid="event-list"]')
        .contains('새로운 E2E 테스트 일정')
        .closest('div.MuiBox-root')
        .find('button[aria-label="Edit event"]')
        .click();

      // 제목과 설명을 변경한 뒤 저장한다.
      cy.get('#title').clear().type(updatedTitle);
      cy.get('[data-testid="event-submit-button"]').click();

      // Then: '일정이 수정되었습니다' 알림이 나타나야 한다.
      cy.contains('일정이 수정되었습니다').should('be.visible');

      // And: 캘린더와 이벤트 목록에 수정된 내용이 반영되어야 한다.
      cy.get('[data-testid="month-view"]').should('contain', updatedTitle);
      cy.get('[data-testid="event-list"]').should('contain', updatedTitle);
      cy.get('[data-testid="event-list"]').should('not.contain', '새로운 E2E 테스트 일정');
    });

    it('시나리오: 사용자가 기존 일정을 삭제한다', () => {
      // Given: 초기 일정이 화면에 표시된 상태에서,
      // When: 오른쪽 목록에서 특정 일정의 '삭제' 버튼을 누른다.
      cy.get('[data-testid="event-list"]')
        .contains('수정된 E2E 테스트 일정')
        .closest('div.MuiBox-root')
        .find('button[aria-label="Delete event"]')
        .click();

      // Then: '일정이 삭제되었습니다' 알림이 나타나야 한다.
      cy.contains('일정이 삭제되었습니다').should('be.visible');

      // And: 캘린더와 이벤트 목록에서 해당 일정이 사라져야 한다.
      cy.get('[data-testid="month-view"]').should('not.contain', '수정된 E2E 테스트 일정');
      cy.get('[data-testid="event-list"]').should('not.contain', '수정된 E2E 테스트 일정');
    });
  });

  describe('2. 반복 일정 기능', () => {
    it("시나리오: 사용자가 '매주' 반복 일정을 생성한다", () => {
      const eventTitle = '매주 E2E 회의';
      // Given: 사용자가 '2025-08-04'(월요일)을 시작일로 선택하고,
      // When: 반복 옵션을 '매주', 종료일을 '2025-08-18'로 설정하고 저장한다.
      createRecurringEvent({
        title: eventTitle,
        date: '2025-08-04',
        startTime: '10:00',
        endTime: '11:00',
        description: '매주 E2E 회의입니다',
        location: '회의실',
        repeat: { type: 'weekly', endDate: '2025-08-18' },
      });
      // Then: 캘린더의 8월 4일, 11일, 18일에 모두 해당 일정이 반복 아이콘과 함께 표시되어야 한다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '4')
          .should('contain', eventTitle)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '11')
          .should('contain', eventTitle)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '18')
          .should('contain', eventTitle)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
      });
    });

    it("시나리오: 사용자가 반복 일정의 '가상 인스턴스'만 수정한다", () => {
      const eventTitle = '반복 테스트용 주간 회의';
      const updatedTitle = '특별 회의';
      // Given: '매주' 반복되는 "주간 회의" 일정이 있는 상태에서,
      createRecurringEvent({
        title: eventTitle,
        date: '2025-08-05',
        startTime: '10:00',
        endTime: '11:00',
        description: '주간 회의입니다',
        location: '회의실',
        repeat: { type: 'weekly', endDate: '2025-08-19' },
      });

      // cy.contains('일정이 추가되었습니다').should('be.visible');

      // When: 캘린더의 '8월 12일' 칸에 있는 "주간 회의"를 클릭하여 제목을 "특별 회의"로 수정한다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '12').within(() => {
          cy.contains(eventTitle).click({ force: true });
        });
      });

      cy.get('#title').clear().type(updatedTitle);
      cy.get('[data-testid="event-submit-button"]').click({ force: true });

      // Then: '8월 12일' 칸에는 "특별 회의"가 표시되고 반복 아이콘이 없어야 한다.
      // And: '8월 5일'과 '8월 19일' 칸에는 여전히 "주간 회의"가 반복 아이콘과 함께 표시되어야 한다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '12')
          .should('contain', updatedTitle)
          .find('[data-testid="recurring-icon"]')
          .should('not.exist');
        cy.contains('td', '5')
          .should('contain', eventTitle)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '19')
          .should('contain', eventTitle)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
      });
    });

    it("시나리오: 사용자가 반복 일정의 '원본'을 삭제한다", () => {
      const eventTitle = '삭제될 주간 회의';
      // Given: '매주' 반복되는 "주간 회의" 일정이 있는 상태에서,
      createRecurringEvent({
        title: eventTitle,
        date: '2025-08-06',
        startTime: '10:00',
        endTime: '11:00',
        description: '주간 회의입니다',
        location: '회의실',
        repeat: { type: 'weekly', endDate: '2025-08-20' },
      });
      // cy.contains('일정이 추가되었습니다').should('be.visible');

      // When: 오른쪽 이벤트 목록에서 '원본'인 "주간 회의"의 삭제 버튼을 누른다.
      cy.get('[data-testid="event-list"]')
        .contains(eventTitle)
        .closest('div.MuiBox-root')
        .find('button[aria-label="Delete event"]')
        .click();
      // cy.contains('일정이 삭제되었습니다').should('be.visible');

      // Then: 캘린더에 있던 모든 "주간 회의" 일정이 사라져야 한다.
      cy.get('[data-testid="month-view"]').should('not.contain', eventTitle);
    });
  });

  describe('3. 캘린더 뷰 및 검색', () => {
    it('시나리오: 사용자가 뷰를 전환하고 날짜를 이동한다', () => {
      // Given: 8월 캘린더가 보이는 상태에서,
      cy.get('[data-testid="month-view"]').should('contain', '2025년 8월');
      // When: 'Next' 버튼을 누른다.
      cy.get('button[aria-label="Next"]').click();
      // Then: 캘린더 제목이 '2025년 9월'로 바뀌어야 한다.
      cy.get('[data-testid="month-view"]').should('contain', '2025년 9월');
      // When: 뷰 타입을 'Week'으로 변경한다.
      cy.get('div[aria-label="뷰 타입 선택"]').click();
      cy.get('li[data-value="week"]').click();
      // Then: '2025년 9월 1주'와 같은 주간 뷰가 표시되어야 한다.
      cy.get('[data-testid="week-view"]').should('contain', '2025년 9월 1주');
    });

    it('시나리오: 사용자가 키워드로 일정을 검색한다', () => {
      // Given: '팀 회의'와 '점심 약속' 일정이 있는 상태에서,
      createEvent({
        title: 'test - 팀 회의',
        date: '2025-08-10',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 회의입니다',
        location: '회의실',
      });
      createEvent({
        title: 'test - 점심 약속',
        date: '2025-08-11',
        startTime: '12:00',
        endTime: '13:00',
        description: '점심 약속입니다',
        location: '식당',
      });

      // When: 오른쪽 검색창에 '회의'라고 입력한다.
      cy.get('#search').type('회의');
      // Then: 오른쪽 이벤트 목록에 '팀 회의'만 남고, '점심 약속'은 사라져야 한다.
      cy.get('[data-testid="event-list"]')
        .should('contain', 'test - 팀 회의')
        .and('not.contain', 'test - 점심 약속');
      // When: 검색창을 비운다.
      cy.get('#search').clear();
      // Then: 두 일정이 모두 다시 표시되어야 한다.
      cy.get('[data-testid="event-list"]')
        .should('contain', 'test - 팀 회의')
        .and('contain', 'test - 점심 약속');
    });
  });

  describe('4. 유효성 검사 및 예외 처리', () => {
    it('시나리오: 사용자가 필수 필드를 비우고 일정을 생성하려고 한다', () => {
      // When: 사용자가 '일정 추가' 폼에서 제목을 입력하지 않고 저장 버튼을 누른다.
      cy.get('[data-testid="event-submit-button"]').click();
      // Then: "필수 정보를 모두 입력해주세요"라는 에러 알림이 나타나야 한다.
      cy.contains('필수 정보를 모두 입력해주세요').should('be.visible');
      // And: 폼은 닫히지 않아야 한다.
    });

    it('시나리오: 사용자가 겹치는 시간에 일정을 생성하려고 한다', () => {
      // Given: '10:00 ~ 11:00'에 "기존 회의" 일정이 있는 상태에서,
      createEvent({
        title: 'test - 기존 회의',
        date: '2025-08-20',
        startTime: '10:00',
        endTime: '11:00',
        description: '기존 회의입니다',
        location: '2번 회의실',
      });
      // When: 사용자가 '10:30 ~ 11:30'에 "새로운 회의"를 생성하려고 한다.
      createEvent({
        title: 'test - 겹치는 일정',
        date: '2025-08-20',
        startTime: '10:30',
        endTime: '11:30',
        description: '겹치는 일정입니다',
        location: '3번 회의실',
      });
      // Then: "일정 겹침 경고" 다이얼로그가 나타나야 한다.
      cy.get('[role="dialog"]').should('contain', '일정 겹침 경고');
      // When: "계속 진행" 버튼을 누른다.
      cy.get('button').contains('계속 진행').click();
      // Then: 겹침 경고 다이얼로그가 닫히고, "새로운 회의"가 정상적으로 추가되어야 한다.
      cy.get('[data-testid="event-list"]').should('contain', 'test - 겹치는 일정');
    });
  });
});
