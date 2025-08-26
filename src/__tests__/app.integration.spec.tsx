import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const theme = createTheme();

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));
};

const createRecurringEvent = async (user: UserEvent, form: Partial<Event>) => {
  const { title, date, startTime, endTime, repeat } = form;

  const addButton = screen.getByRole('button', { name: '일정 추가' });
  await user.click(addButton);

  const titleInput = await screen.findByLabelText('제목');

  if (title) await user.type(titleInput, title);
  if (date) await user.type(screen.getByLabelText('날짜'), date);
  if (startTime) await user.type(screen.getByLabelText('시작 시간'), startTime);
  if (endTime) await user.type(screen.getByLabelText('종료 시간'), endTime);

  if (repeat && repeat.type !== 'none') {
    const repeatTypeSelectTrigger = screen.getByLabelText('반복 유형');
    await user.click(repeatTypeSelectTrigger);

    const optionsList = await screen.findByRole('listbox');
    const repeatTypeMap = {
      daily: '매일',
      weekly: '매주',
      monthly: '매월',
      yearly: '매년',
    };
    await user.click(within(optionsList).getByText(repeatTypeMap[repeat.type]));

    if (repeat.endDate) {
      await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate);
    }
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 1,
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: 2,
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

describe('일정 알람 기능', () => {
  it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
    vi.setSystemTime(new Date('2025-10-15 08:49:59'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
  });
});

describe('반복 일정 기능', () => {
  beforeEach(() => {
    setupMockHandlerCreation();
  });

  it('사용자가 "매일" 반복 일정을 생성하면, 달력에 여러 날짜에 걸쳐 일정이 표시된다', async () => {
    const { user } = setup(<App />);
    const dailyEvent: Event = {
      title: '매일 아침 조깅',
      date: '2025-10-01',
      startTime: '07:00',
      endTime: '08:00',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-27' },
      id: '',
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
    };

    await createRecurringEvent(user, dailyEvent);

    const calendarGrid = screen.getByTestId('month-view');
    for (let day = 1; day <= 3; day++) {
      const dayCellContent = await within(calendarGrid).findByText(String(day));
      const dayCell = dayCellContent.closest('td');

      const eventTitle = await within(dayCell as HTMLElement).findByText('매일 아침 조깅');
      expect(eventTitle).toBeInTheDocument();
    }
  });

  it('반복 일정 중 하나를 수정하면, 해당 날짜의 일정만 단일 일정으로 변경된다', async () => {
    const { user } = setup(<App />);
    const weeklyEvent: Event = {
      title: '주간 회의',
      date: '2025-10-06', // 월요일
      startTime: '10:00',
      endTime: '11:00',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-20' },
      id: '',
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
    };
    await createRecurringEvent(user, weeklyEvent);
    await screen.findByText('일정이 추가되었습니다.');

    const eventList = screen.getByTestId('event-list');
    const eventBoxes = await within(eventList).findAllByText('주간 회의');
    const eventContainer = eventBoxes[1].closest('div.MuiBox-root');
    const editButton = within(eventContainer as HTMLElement).getByLabelText('Edit event');
    await user.click(editButton);

    const titleInput = await screen.findByLabelText('제목');
    expect(titleInput).toHaveValue('주간 회의');

    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');
    await user.click(screen.getByTestId('event-submit-button'));

    await screen.findByText('반복 일정 중 하나가 단일 일정으로 수정되었습니다.');

    const day13Cell = await screen.findByText('13');
    expect(
      await within(day13Cell.closest('td') as HTMLElement).findByText('수정된 회의')
    ).toBeInTheDocument();

    const day20Cell = screen.getByText('20');
    expect(
      within(day20Cell.closest('td') as HTMLElement).getByText('주간 회의')
    ).toBeInTheDocument();
  });

  it('반복 일정 중 하나를 삭제하면, 해당 날짜의 일정만 사라진다', async () => {
    const { user } = setup(<App />);
    await createRecurringEvent(user, {
      title: '매일 회의',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-03' },
    });
    await screen.findByText('일정이 추가되었습니다.');

    const eventList = screen.getByTestId('event-list');
    const eventBoxes = await within(eventList).findAllByText('매일 회의');
    const eventContainer = eventBoxes[1].closest('div.MuiBox-root');
    const deleteButton = within(eventContainer as HTMLElement).getByLabelText('Delete event');
    await user.click(deleteButton);

    await screen.findByText('반복 일정 중 하나만 삭제되었습니다.');

    const day2Cell = await screen.findByText('2');
    expect(
      within(day2Cell.closest('td') as HTMLElement).queryByText('매일 회의')
    ).not.toBeInTheDocument();

    const day3Cell = screen.getByText('3');
    expect(
      within(day3Cell.closest('td') as HTMLElement).getByText('매일 회의')
    ).toBeInTheDocument();
  });

  describe('원본 반복 일정 수정 및 삭제', () => {
    const recurringEvent: Event = {
      id: 'recurring-event-1',
      title: '원본 주간 회의',
      date: '2025-10-06', // 월요일
      startTime: '10:00',
      endTime: '11:00',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-20' },
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
    };

    it('원본 반복 일정을 수정하면, 모든 미래의 가상 일정이 함께 변경된다', async () => {
      setupMockHandlerUpdating([recurringEvent]);
      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventList = screen.getByTestId('event-list');
      const originalEventBox = await within(eventList).findAllByText('원본 주간 회의');
      const eventContainer = originalEventBox[0].closest('div.MuiBox-root');

      const editButton = within(eventContainer as HTMLElement).getByLabelText('Edit event');
      await user.click(editButton);

      const titleInput = await screen.findByLabelText('제목');
      await user.clear(titleInput);
      await user.type(titleInput, '전사 타운홀 미팅');
      await user.click(screen.getByTestId('event-submit-button'));

      await screen.findByText('일정이 수정되었습니다.');

      const calendarGrid = screen.getByTestId('month-view');
      await waitFor(async () => {
        const updatedEvents = await within(calendarGrid).findAllByText('전사 타운홀 미팅');
        expect(updatedEvents).toHaveLength(3);
      });
    });

    it('원본 반복 일정을 삭제하면, 모든 가상 일정이 함께 사라진다', async () => {
      setupMockHandlerDeletion([recurringEvent]);
      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventList = screen.getByTestId('event-list');
      const eventToDelete = await within(eventList).findAllByText('원본 주간 회의');
      const eventContainer = eventToDelete[0].closest('div.MuiBox-root');
      const deleteButton = within(eventContainer as HTMLElement).getByLabelText('Delete event');

      await user.click(deleteButton);

      await screen.findByText('일정이 삭제되었습니다.');

      const calendarGrid = screen.getByTestId('month-view');
      await waitFor(() => {
        expect(within(calendarGrid).queryByText('삭제할 이벤트')).not.toBeInTheDocument();
      });
    });
  });
});
