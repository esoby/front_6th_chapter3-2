import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Notifications from '@mui/icons-material/Notifications';
import Repeat from '@mui/icons-material/Repeat';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { Event } from '../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

export const CalendarView = ({ viewProps }) => {
  const {
    view,
    setView,
    currentDate,
    navigate,
    holidays,
    filteredEvents,
    notifiedEvents,
    editEvent,
  } = viewProps;
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates.map((date) => (
                  <TableCell
                    key={date.toISOString()}
                    sx={{
                      height: '120px',
                      verticalAlign: 'top',
                      width: '14.28%',
                      padding: 1,
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {date.getDate()}
                    </Typography>
                    {/* filteredEvents에서 해당 날짜의 이벤트만 필터링하여 표시합니다. */}
                    {filteredEvents
                      .filter(
                        (event: Event) =>
                          new Date(event.date).toDateString() === date.toDateString()
                      )
                      .map((event: Event) => {
                        const isNotified = notifiedEvents.includes(event.id);
                        const isRecurring = event.repeat.type !== 'none';
                        return (
                          <Box
                            key={event.id}
                            sx={{
                              p: 0.5,
                              my: 0.5,
                              backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                              borderRadius: 1,
                              fontWeight: isNotified ? 'bold' : 'normal',
                              color: isNotified ? '#d32f2f' : 'inherit',
                              minHeight: '18px',
                              width: '100%',
                              overflow: 'hidden',
                              cursor: 'pointer',
                            }}
                            onClick={() => editEvent(event)}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              {isNotified && (
                                <Notifications data-testid="notification-icon" fontSize="small" />
                              )}
                              {isRecurring && (
                                <Repeat data-testid="recurring-icon" fontSize="small" />
                              )}
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                              >
                                {event.title}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);
    return (
      <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatMonth(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dateString = day ? formatDate(currentDate, day) : '';
                    const holiday = holidays[dateString];
                    return (
                      <TableCell
                        key={dayIndex}
                        sx={{
                          height: '120px',
                          verticalAlign: 'top',
                          padding: 1,
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        {day && (
                          <>
                            <Typography variant="body2" fontWeight="bold">
                              {day}
                            </Typography>
                            {holiday && (
                              <Typography variant="body2" color="error">
                                {holiday}
                              </Typography>
                            )}
                            {getEventsForDay(filteredEvents, day).map((event) => {
                              const isNotified = notifiedEvents.includes(event.id);
                              const isRecurring = event.repeat.type !== 'none';
                              return (
                                <Box
                                  key={event.id}
                                  onClick={() => editEvent(event)}
                                  sx={{
                                    cursor: 'pointer',
                                    p: 0.5,
                                    my: 0.5,
                                    backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {isNotified && <Notifications fontSize="small" />}
                                    {isRecurring && (
                                      <Repeat data-testid="recurring-icon" fontSize="small" />
                                    )}
                                    <Typography
                                      variant="caption"
                                      noWrap
                                      sx={{ fontSize: '0.75rem' }}
                                    >
                                      {event.title}
                                    </Typography>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  return (
    <Stack flex={1} spacing={5}>
      <Typography variant="h4">일정 보기</Typography>
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
        <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
          <ChevronLeft />
        </IconButton>
        <Select
          size="small"
          aria-label="뷰 타입 선택"
          value={view}
          onChange={(e) => setView(e.target.value as 'week' | 'month')}
        >
          <MenuItem value="week" aria-label="week-option">
            Week
          </MenuItem>
          <MenuItem value="month" aria-label="month-option">
            Month
          </MenuItem>
        </Select>
        <IconButton aria-label="Next" onClick={() => navigate('next')}>
          <ChevronRight />
        </IconButton>
      </Stack>
      {view === 'week' ? renderWeekView() : renderMonthView()}
    </Stack>
  );
};
