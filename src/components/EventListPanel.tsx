import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Notifications from '@mui/icons-material/Notifications';
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Event } from '../types';

export const EventListPanel = ({ listProps }) => {
  const { searchTerm, setSearchTerm, filteredEvents, notifiedEvents, editEvent, deleteEvent } =
    listProps;
  const notificationOptions = [
    { value: 1, label: '1분 전' },
    { value: 10, label: '10분 전' },
    { value: 60, label: '1시간 전' },
    { value: 120, label: '2시간 전' },
    { value: 1440, label: '1일 전' },
  ];

  return (
    <Stack
      data-testid="event-list"
      spacing={2}
      sx={{ width: '30%', height: '100%', overflowY: 'auto' }}
    >
      <FormControl fullWidth>
        <FormLabel htmlFor="search">일정 검색</FormLabel>
        <TextField
          id="search"
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FormControl>

      {filteredEvents.length === 0 ? (
        <Typography>검색 결과가 없습니다.</Typography>
      ) : (
        filteredEvents.map((event: Event) => (
          <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                  <Typography
                    fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                    color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                  >
                    {event.title}
                  </Typography>
                </Stack>
                <Typography>{event.date}</Typography>
                <Typography>
                  {event.startTime} - {event.endTime}
                </Typography>
                <Typography>{event.description}</Typography>
                <Typography>{event.location}</Typography>
                <Typography>카테고리: {event.category}</Typography>
                {event.repeat.type !== 'none' && (
                  <Typography>
                    반복: {event.repeat.interval}
                    {event.repeat.type === 'daily' && '일'}
                    {event.repeat.type === 'weekly' && '주'}
                    {event.repeat.type === 'monthly' && '월'}
                    {event.repeat.type === 'yearly' && '년'}
                    마다
                    {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                  </Typography>
                )}
                <Typography>
                  알림: {notificationOptions.find((o) => o.value === event.notificationTime)?.label}
                </Typography>
              </Stack>
              <Stack>
                <IconButton aria-label="Edit event" onClick={() => editEvent(event)}>
                  <Edit />
                </IconButton>
                <IconButton aria-label="Delete event" onClick={() => deleteEvent(event.id)}>
                  <Delete />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
};
