/// <reference types="cypress" />

const initialEventData = {
  title: 'E2E 테스트 일정',
  date: '2025-08-04',
  startTime: '14:00',
  endTime: '15:00',
  description: '테스트 내용',
  location: '테스트 장소',
};

const createEvent = (eventData) => {
  const { title, date, startTime, endTime, description, location, repeat } = eventData;

  // 공통 필드
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

  afterEach(() => {
    cy.request('GET', '/api/events').then((response) => {
      const testEvents = response.body.events.filter((event) => event.title.includes('E2E 테스트'));

      testEvents.forEach((event) => {
        cy.request('DELETE', `/api/events/${event.id}`);
        cy.log(`${event.title} (ID: ${event.id}) 삭제 완료`);
      });
    });
  });

  describe('1. 기본 CRUD (Create, Read, Update, Delete)', () => {
    beforeEach(() => {
      cy.clock(new Date('2025-08-01T10:00:00'));
      cy.visit('/');
    });

    it('시나리오: 사용자가 새 단일 일정을 성공적으로 생성한다', () => {
      // When: 모든 필드를 유효하게 채운 뒤 저장한다.
      createEvent(initialEventData);

      // Then: '일정이 추가되었습니다' 알림이 나타나야 한다.
      cy.contains('일정이 추가되었습니다').should('be.visible');
      cy.tick(5000);

      // And: 캘린더와 이벤트 목록에 새로운 일정이 표시되어야 한다.
      cy.get('[data-testid="month-view"]').should('contain', initialEventData.title);
      cy.get('[data-testid="event-list"]').should('contain', initialEventData.title);
    });

    it('시나리오: 사용자가 기존 일정을 성공적으로 수정한다', () => {
      const updatedTitle = '수정된 E2E 테스트';

      // Given: 초기 일정이 화면에 표시된 상태에서,
      createEvent(initialEventData);
      cy.tick(5000);

      // When: 오른쪽 목록에서 특정 일정의 '수정' 버튼을 누르고,
      cy.get('[data-testid="event-list"]')
        .contains(initialEventData.title)
        .closest('div.MuiBox-root')
        .find('button[aria-label="Edit event"]')
        .click();

      // 제목과 설명을 변경한 뒤 저장한다.
      cy.get('#title').clear();
      cy.get('#title').type(updatedTitle);
      cy.get('[data-testid="event-submit-button"]').click();

      // And: 캘린더와 이벤트 목록에 수정된 내용이 반영되어야 한다.
      cy.get('[data-testid="month-view"]').should('contain', updatedTitle);
      cy.get('[data-testid="event-list"]').should('contain', updatedTitle);
      cy.get('[data-testid="event-list"]').should('not.contain', initialEventData.title);
    });

    it('시나리오: 사용자가 기존 일정을 삭제한다', () => {
      // Given: 초기 일정이 화면에 표시된 상태에서,
      createEvent(initialEventData);

      // When: 오른쪽 목록에서 특정 일정의 '삭제' 버튼을 누른다.
      cy.get('[data-testid="event-list"]')
        .contains(initialEventData.title)
        .closest('div.MuiBox-root')
        .find('button[aria-label="Delete event"]')
        .click();

      // And: 캘린더와 이벤트 목록에서 해당 일정이 사라져야 한다.
      cy.get('[data-testid="month-view"]').should('not.contain', initialEventData.title);
      cy.get('[data-testid="event-list"]').should('not.contain', initialEventData.title);
    });
  });

  describe('2. 반복 일정 기능', () => {
    it("시나리오: 사용자가 '매주' 반복 일정을 생성한다", () => {
      // Given: 사용자가 반복 옵션과 종료일을 설정하고 저장한다.
      createEvent({
        ...initialEventData,
        repeat: { type: 'weekly', endDate: '2025-08-18' },
      });

      // Then: 캘린더의 8월 4일, 11일, 18일에 모두 해당 일정이 반복 아이콘과 함께 표시되어야 한다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '4')
          .should('contain', initialEventData.title)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '11')
          .should('contain', initialEventData.title)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '18')
          .should('contain', initialEventData.title)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
      });
    });

    it("시나리오: 사용자가 반복 일정의 '가상 인스턴스'만 수정한다", () => {
      const updatedTitle = 'E2E 테스트 특별 일정';

      // Given: '매주' 반복되는 일정이 있는 상태에서,
      createEvent({
        ...initialEventData,
        repeat: { type: 'weekly', endDate: '2025-08-18' },
      });

      // When: 한 가상 인스턴스의 제목을 수정한다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '11').within(() => {
          cy.contains(initialEventData.title).click({ force: true });
        });
      });

      cy.get('#title').clear();
      cy.get('#title').type(updatedTitle);
      cy.get('[data-testid="event-submit-button"]').click({ force: true });

      // Then: 수정된 가상 인스턴스 일정은 반복 일정으로부터 독립된다.
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '11')
          .should('contain', updatedTitle)
          .find('[data-testid="recurring-icon"]')
          .should('not.exist');
      });
      cy.get('[data-testid="month-view"]').within(() => {
        cy.contains('td', '4')
          .should('contain', initialEventData.title)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
        cy.contains('td', '18')
          .should('contain', initialEventData.title)
          .find('[data-testid="recurring-icon"]')
          .should('exist');
      });
    });

    it("시나리오: 사용자가 반복 일정의 '원본'을 삭제한다", () => {
      // Given: '매주' 반복되는 일정이 있는 상태에서,
      createEvent({
        ...initialEventData,
        repeat: { type: 'weekly', endDate: '2025-08-18' },
      });

      // When: 오른쪽 이벤트 목록에서 반복 일정 원본의 삭제 버튼을 누른다.
      cy.get('[data-testid="event-list"]')
        .contains(initialEventData.title)
        .closest('div.MuiBox-root')
        .find('button[aria-label="Delete event"]')
        .click();

      // Then: 캘린더에 있던 모든 "주간 회의" 일정이 사라져야 한다.
      cy.get('[data-testid="month-view"]').should('not.contain', initialEventData.title);
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
        title: 'E2E 테스트 - 팀 회의',
        date: '2025-08-16',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 회의입니다',
        location: '회의실',
      });
      createEvent({
        title: 'E2E 테스트 - 점심 약속',
        date: '2025-08-16',
        startTime: '12:00',
        endTime: '13:00',
        description: '점심 약속입니다',
        location: '식당',
      });

      // When: 오른쪽 검색창에 '회의'라고 입력한다.
      cy.get('#search').type('회의');
      // Then: 오른쪽 이벤트 목록에 '팀 회의'만 남고, '점심 약속'은 사라져야 한다.
      cy.get('[data-testid="event-list"]')
        .should('contain', 'E2E 테스트 - 팀 회의')
        .and('not.contain', 'E2E 테스트 - 점심 약속');
      // When: 검색창을 비운다.
      cy.get('#search').clear();
      // Then: 두 일정이 모두 다시 표시되어야 한다.
      cy.get('[data-testid="event-list"]')
        .should('contain', 'E2E 테스트 - 팀 회의')
        .and('contain', 'E2E 테스트 - 점심 약속');
    });
  });

  describe('4. 유효성 검사 및 예외 처리', () => {
    it('시나리오: 사용자가 필수 필드를 비우고 일정을 생성하려고 한다', () => {
      // When: 사용자가 '일정 추가' 폼에서 제목을 입력하지 않고 저장 버튼을 누른다.
      cy.get('[data-testid="event-submit-button"]').click();
      // Then: "필수 정보를 모두 입력해주세요"라는 에러 알림이 나타나야 한다.
      cy.contains('필수 정보를 모두 입력해주세요').should('be.visible');
    });

    it('시나리오: 사용자가 겹치는 시간에 일정을 생성하려고 한다', () => {
      // Given: '10:00 ~ 11:00'에 "기존 회의" 일정이 있는 상태에서,
      createEvent({
        title: 'E2E 테스트 - 기존 회의',
        date: '2025-08-16',
        startTime: '10:00',
        endTime: '11:00',
        description: '기존 회의입니다',
        location: '2번 회의실',
      });
      // When: 사용자가 '10:30 ~ 11:30'에 "새로운 회의"를 생성하려고 한다.
      createEvent({
        title: 'E2E 테스트 - 겹치는 일정',
        date: '2025-08-16',
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
      cy.get('[data-testid="event-list"]').should('contain', 'E2E 테스트 - 겹치는 일정');
    });
  });
});
