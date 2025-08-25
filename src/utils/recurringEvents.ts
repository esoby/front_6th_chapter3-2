import { Event } from '../types';
import { formatDate } from './dateUtils';

/**
 * @description 원본 이벤트를 기반으로 반복되는 가상 이벤트 인스턴스들을 생성합니다.
 * @param baseEvent - 반복 규칙을 가진 원본 이벤트
 * @returns 생성된 가상 이벤트의 배열 (원본 이벤트 제외)
 */
export function generateRecurringEvents(baseEvent: Event): Event[] {
  if (!baseEvent.repeat || baseEvent.repeat.type === 'none' || !baseEvent.repeat.endDate) {
    return [];
  }

  const recurringEvents: Event[] = [];
  const { type, endDate, exceptions = [] } = baseEvent.repeat;
  const finalEndDate = new Date(endDate);
  const originalDayOfMonth = new Date(baseEvent.date).getDate();

  if (finalEndDate < new Date(baseEvent.date)) {
    return [];
  }

  let loopCounter = 1;

  while (true) {
    const nextDate = new Date(baseEvent.date);

    if (type === 'daily') {
      nextDate.setDate(nextDate.getDate() + loopCounter);
    } else if (type === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7 * loopCounter);
    } else if (type === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + loopCounter);
    } else if (type === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + loopCounter);
    }

    if (nextDate > finalEndDate) {
      break;
    }

    loopCounter++;

    if ((type === 'monthly' || type === 'yearly') && nextDate.getDate() !== originalDayOfMonth) {
      continue;
    }

    const currentDateStr = formatDate(nextDate);
    if (exceptions.includes(currentDateStr)) {
      continue;
    }

    recurringEvents.push({
      ...baseEvent,
      id: `${baseEvent.id}-recurring-${currentDateStr}`,
      date: currentDateStr,
    });
  }

  return recurringEvents;
}

/**
 * @description 특정 기간 내에 표시되어야 할 모든 이벤트(원본 + 반복)를 반환합니다.
 * @param allEvents - 저장된 모든 원본 이벤트 배열
 * @param viewStartDate - 캘린더 뷰의 시작일
 * @param viewEndDate - 캘린더 뷰의 종료일
 * @returns 뷰에 표시될 이벤트 배열
 */
export function getEventsForView(
  allEvents: Event[],
  viewStartDate: Date,
  viewEndDate: Date
): Event[] {
  const eventsInView: Event[] = [];

  allEvents.forEach((event) => {
    const eventDate = new Date(event.date);
    const isException = event.repeat?.exceptions?.includes(event.date);

    if (!isException && eventDate >= viewStartDate && eventDate <= viewEndDate) {
      eventsInView.push(event);
    }

    if (event.repeat && event.repeat.type !== 'none') {
      const recurringInstances = generateRecurringEvents(event);
      const recurringInView = recurringInstances.filter((instance) => {
        const instanceDate = new Date(instance.date);
        return instanceDate >= viewStartDate && instanceDate <= viewEndDate;
      });
      eventsInView.push(...recurringInView);
    }
  });

  return eventsInView;
}

/**
 * @description 반복 일정 중 특정 날짜의 인스턴스만 수정합니다.
 * @returns 수정된 전체 이벤트 목록과, 새로 생성된 단일 이벤트
 */
export function updateSingleRecurringEvent(
  allEvents: Event[],
  originalEventId: string,
  modificationDate: string,
  updatedInfo: Partial<Event>
) {
  const newEvents = [...allEvents];
  const originalEventIndex = newEvents.findIndex((e) => e.id === originalEventId);
  if (originalEventIndex === -1) return { updatedEvents: allEvents, newSingleEvent: null };

  const originalEvent = { ...newEvents[originalEventIndex] };

  const exceptions = [...(originalEvent.repeat.exceptions || []), modificationDate];
  originalEvent.repeat = { ...originalEvent.repeat, exceptions };
  newEvents[originalEventIndex] = originalEvent;

  const newSingleEvent: Event = {
    ...originalEvent,
    ...updatedInfo,
    id: `single-${Date.now()}`,
    date: modificationDate,
    repeat: { type: 'none', interval: 0 },
  };
  newEvents.push(newSingleEvent);

  return { updatedEvents: newEvents, newSingleEvent };
}

/**
 * @description 반복 일정 중 특정 날짜의 인스턴스만 삭제합니다.
 * @returns 수정된 전체 이벤트 목록
 */
export function deleteSingleRecurringEvent(
  allEvents: Event[],
  originalEventId: string,
  deletionDate: string
) {
  const newEvents = [...allEvents];
  const originalEventIndex = newEvents.findIndex((e) => e.id === originalEventId);
  if (originalEventIndex === -1) return { updatedEvents: allEvents };

  const originalEvent = { ...newEvents[originalEventIndex] };

  const exceptions = [...(originalEvent.repeat.exceptions || []), deletionDate];
  originalEvent.repeat = { ...originalEvent.repeat, exceptions };
  newEvents[originalEventIndex] = originalEvent;

  return { updatedEvents: newEvents };
}
