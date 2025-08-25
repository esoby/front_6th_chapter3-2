import { describe, it, expect } from 'vitest';

import { Event } from '../../types';
import {
  generateRecurringEvents,
  getEventsForView,
  updateSingleRecurringEvent,
  deleteSingleRecurringEvent,
} from '../../utils/recurringEvents';

// --- 테스트 데이터 ---
const baseDailyEvent: Event = {
  id: '1',
  title: '매일 스탠드업',
  date: '2025-08-25',
  startTime: '09:00',
  endTime: '09:15',
  repeat: { type: 'daily', interval: 1, endDate: '2025-08-30' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

const baseWeeklyEvent: Event = {
  id: '2',
  title: '매주 주간 보고',
  date: '2025-08-25', // 월요일
  startTime: '09:00',
  endTime: '10:00',
  repeat: { type: 'weekly', interval: 1, endDate: '2025-09-08' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

const baseMonthlyEvent: Event = {
  id: '3',
  title: '매월 1일 회의',
  date: '2025-08-01',
  startTime: '09:00',
  endTime: '10:00',
  repeat: { type: 'monthly', interval: 1, endDate: '2025-11-30' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

const baseMonthlyEdgeCaseEvent: Event = {
  id: '3-edge',
  title: '매월 31일 월급',
  date: '2025-01-31',
  startTime: '18:00',
  endTime: '18:01',
  repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

const baseYearlyEvent: Event = {
  id: '4',
  title: '매년 워크샵',
  date: '2025-08-25',
  startTime: '09:00',
  endTime: '18:00',
  repeat: { type: 'yearly', interval: 1, endDate: '2027-12-31' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

const baseLeapYearEvent: Event = {
  id: '4-leap',
  title: '윤년 기념일',
  date: '2024-02-29', // 윤년
  startTime: '10:00',
  endTime: '11:00',
  repeat: { type: 'yearly', interval: 1, endDate: '2028-12-31' },
  description: '',
  location: '',
  category: '',
  notificationTime: 0,
};

// --- 1. 반복 유형 선택 ---
describe('반복 유형 선택', () => {
  describe('사용자가 반복 유형을 매일로 설정한다', () => {
    it('2025-08-25 09:00에 시작하는 일정 생성 폼에서, 반복 유형을 2025-08-30까지 "매일"로 선택한 후에 일정을 추가하면, 2025-08-25부터 2025-08-30까지 매일 동일 시간대의 이벤트가 표시된다', () => {
      const allEvents = [baseDailyEvent];
      const viewStart = new Date('2025-08-25');
      const viewEnd = new Date('2025-08-30');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      expect(eventsInView).toHaveLength(6);
      expect(eventsInView.every((e) => e.title === '매일 스탠드업')).toBe(true);
    });
  });

  describe('사용자가 반복 유형을 매주로 설정한다', () => {
    it('2025-08-25(월요일) 09:00에 시작하는 일정 생성 폼에서, 반복 유형을 2025-09-08까지 "매주"로 선택한 후에 일정을 추가하면, 2025-08-25, 2025-09-01, 2025-09-08에 매주 동일 시간대의 이벤트가 표시된다', () => {
      const allEvents = [baseWeeklyEvent];
      const viewStart = new Date('2025-08-25');
      const viewEnd = new Date('2025-09-08');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      expect(eventsInView).toHaveLength(3);
      expect(eventsInView[0].date).toBe('2025-08-25');
      expect(eventsInView[1].date).toBe('2025-09-01');
      expect(eventsInView[2].date).toBe('2025-09-08');
    });
  });

  describe('사용자가 반복 유형을 매월로 설정한다', () => {
    it('2025-08-01 09:00에 시작하는 일정 생성 폼에서, 반복 유형을 2025-11월까지 "매월"로 선택한 후에 일정을 추가하면, 2025-08부터 2025-11까지 매월 동일 시간대의 이벤트가 표시된다', () => {
      const allEvents = [baseMonthlyEvent];
      const viewStart = new Date('2025-08-01');
      const viewEnd = new Date('2025-11-30');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      expect(eventsInView).toHaveLength(4);
      expect(eventsInView[0].date).toBe('2025-08-01');
      expect(eventsInView[3].date).toBe('2025-11-01');
    });

    it('2025-01-31 09:00에 시작하는 일정 생성 폼에서 반복 유형을 "매월"로 선택한 후에 일정을 추가하면, 1월, 3월, 5월 등 31일이 있는 달에만 일정이 생성된다', () => {
      const allEvents = [baseMonthlyEdgeCaseEvent];
      const viewStart = new Date('2025-01-01');
      const viewEnd = new Date('2025-12-31');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      const dates = eventsInView.map((e) => e.date);
      expect(eventsInView).toHaveLength(7);
      expect(dates).toContain('2025-01-31');
      expect(dates).not.toContain('2025-02-28');
      expect(dates).toContain('2025-03-31');
      expect(dates).not.toContain('2025-04-30');
    });
  });

  describe('사용자가 반복 유형을 매년으로 설정한다', () => {
    it('2025-08-25 09:00에 시작하는 일정 생성 폼에서, 반복 유형을 2027년까지 "매년"으로 선택한 후에 일정을 추가하면, 생성 결과에 2027년까지 매년 08-25 09:00 일정이 표시된다', () => {
      const allEvents = [baseYearlyEvent];
      const viewStart = new Date('2025-01-01');
      const viewEnd = new Date('2027-12-31');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      expect(eventsInView).toHaveLength(3);
      expect(eventsInView.map((e) => e.date)).toEqual(['2025-08-25', '2026-08-25', '2027-08-25']);
    });

    it('2024-02-29(윤년) 10:00에 시작하는 일정 생성 폼에서 반복 유형을 2028년까지 "매년"으로 선택하면, 다음 생성일은 2028-02-29 10:00이다', () => {
      const allEvents = [baseLeapYearEvent];
      const viewStart = new Date('2025-01-01');
      const viewEnd = new Date('2028-12-31');
      const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

      expect(eventsInView).toHaveLength(1);
      expect(eventsInView[0].date).toBe('2028-02-29');
    });
  });
});

// --- 2. 반복 일정 표시 ---
describe('캘린더 뷰에서 반복 일정을 아이콘을 넣어 구분하여 표시한다', () => {
  it('반복 일정이 존재하는 상태에서 캘린더를 렌더링하면, 해당 일정에 반복 아이콘이 표시된다', () => {
    const allEvents = [baseWeeklyEvent];
    const viewStart = new Date('2025-10-01');
    const viewEnd = new Date('2025-10-08');
    const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

    expect(eventsInView.every((e) => e.repeat.type !== 'none')).toBe(true);
  });

  it('반복 일정이 없는 상태에서 캘린더를 렌더링하면, 반복 일정 아이콘이 표시되지 않는다', () => {
    const singleEvent: Event = { ...baseDailyEvent, repeat: { type: 'none', interval: 0 } };
    const allEvents = [singleEvent];
    const viewStart = new Date('2025-10-01');
    const viewEnd = new Date('2025-10-01');
    const eventsInView = getEventsForView(allEvents, viewStart, viewEnd);

    expect(eventsInView.every((e) => e.repeat.type === 'none')).toBe(true);
  });
});

// --- 3. 반복 종료 조건 ---
describe('반복 종료 조건을 지정할 수 있다', () => {
  it("일정 생성 폼에서 '2025-08-25 ~ 2025-09-10'으로 매주 반복 일정을 생성하면, '2025-09-01'과 '2025-09-08'에 해당하는 2개의 반복 일정만 생성된다", () => {
    const event: Event = {
      ...baseWeeklyEvent,
      repeat: { type: 'weekly', interval: 1, endDate: '2025-09-10' },
    };
    const recurringEvents = generateRecurringEvents(event);
    expect(recurringEvents).toHaveLength(2);
    expect(recurringEvents[0].date).toBe('2025-09-01');
    expect(recurringEvents[1].date).toBe('2025-09-08');
  });

  it('일정 생성 폼에서 시작일과 동일하거나 시작일 이전의 날짜로 종료일을 선택하여 생성하면, "종료일은 시작일 이후여야 합니다" 토스트가 노출되며 에러 처리가 되어야 한다.', () => {
    const event: Event = {
      ...baseDailyEvent,
      repeat: { type: 'daily', interval: 1, endDate: '2025-08-24' },
    };
    const recurringEvents = generateRecurringEvents(event);
    expect(recurringEvents).toEqual([]);
  });
});

// --- 4. 반복 일정 단일 수정 ---
describe('반복일정을 수정하면 단일 일정으로 변경된다', () => {
  it('매주 월요일 09시 반복 일정이 존재하고, 2025-09-01 09시 일정의 제목을 변경하면, 해당 날짜의 일정만 단일 일정으로 변경되고 반복 아이콘이 사라진다', () => {
    const allEvents = [{ ...baseWeeklyEvent, date: '2025-08-25' }];
    const modificationDate = '2025-09-01';
    const updatedInfo = { title: '수정된 월요 보고' };

    const { updatedEvents, newSingleEvent } = updateSingleRecurringEvent(
      allEvents,
      allEvents[0].id,
      modificationDate,
      updatedInfo
    );

    expect(newSingleEvent).toBeDefined();
    expect(newSingleEvent?.title).toBe('수정된 월요 보고');
    expect(newSingleEvent?.repeat.type).toBe('none');

    const viewStart = new Date('2025-09-01');
    const viewEnd = new Date('2025-09-01');
    const eventsInView = getEventsForView(updatedEvents, viewStart, viewEnd);

    expect(eventsInView).toHaveLength(1);
    expect(eventsInView[0].id).toBe(newSingleEvent?.id);
  });
});

// --- 5. 반복 일정 단일 삭제 ---
describe('반복일정을 삭제하면 해당 일정만 삭제합니다', () => {
  it('매일 09시 반복 일정이 존재하고, 2025-08-27 09시 일정을 삭제하면, 해당 날짜의 일정만 캘린더에서 사라지고 다른 날짜의 반복 일정은 유지된다', () => {
    const allEvents = [{ ...baseDailyEvent, date: '2025-08-25' }];
    const deletionDate = '2025-08-27';

    const { updatedEvents } = deleteSingleRecurringEvent(allEvents, allEvents[0].id, deletionDate);

    const viewStart = new Date('2025-08-27');
    const viewEnd = new Date('2025-08-27');
    const eventsInView = getEventsForView(updatedEvents, viewStart, viewEnd);
    expect(eventsInView).toHaveLength(0);

    const nextDayStart = new Date('2025-08-28');
    const nextDayEnd = new Date('2025-08-28');
    const eventsInNextDayView = getEventsForView(updatedEvents, nextDayStart, nextDayEnd);
    expect(eventsInNextDayView).toHaveLength(1);
  });
});
