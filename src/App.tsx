import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { CalendarView } from './components/CalendarView';
import { EventFormPanel } from './components/EventFormPanel';
import { EventListPanel } from './components/EventListPanel';
import { NotificationPanel } from './components/NotificationPanel';
import { useCalendarView } from './hooks/useCalendarView';
import { useEventForm } from './hooks/useEventForm';
import { useEventOperations } from './hooks/useEventOperations';
import { useFilteredEvents } from './hooks/useFilteredEvents';
import { useNotifications } from './hooks/useNotifications';
import { Event, EventForm } from './types';
import { findOverlappingEvents } from './utils/eventOverlap';

function App() {
  const formProps = useEventForm();
  const {
    editingEvent,
    resetForm,
    title,
    date,
    startTime,
    endTime,
    description,
    location,
    category,
    isRepeating,
    repeatType,
    repeatInterval,
    repeatEndDate,
    notificationTime,
    startTimeError,
    endTimeError,
  } = formProps;

  const { events, saveEvent, deleteEvent } = useEventOperations(Boolean(editingEvent), () => {
    formProps.setEditingEvent(null);
    resetForm();
  });

  const { notifications, notifiedEvents, removeNotification } = useNotifications(events);
  const calendarViewProps = useCalendarView();
  const { filteredEvents, searchTerm, setSearchTerm } = useFilteredEvents(
    events,
    calendarViewProps.currentDate,
    calendarViewProps.view
  );

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }
    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData: Event | EventForm = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: {
        type: isRepeating ? repeatType : 'none',
        interval: repeatInterval,
        endDate: repeatEndDate || undefined,
      },
      notificationTime,
    };

    const overlapping = findOverlappingEvents(eventData, events);
    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      await saveEvent(eventData);
      resetForm();
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <EventFormPanel formProps={{ ...formProps, addOrUpdateEvent }} />
        <CalendarView
          viewProps={{
            ...calendarViewProps,
            filteredEvents,
            notifiedEvents,
            editEvent: formProps.editEvent,
          }}
        />
        <EventListPanel
          listProps={{
            searchTerm,
            setSearchTerm,
            filteredEvents,
            notifiedEvents,
            editEvent: formProps.editEvent,
            deleteEvent,
          }}
        />
      </Stack>

      <Dialog open={isOverlapDialogOpen} onClose={() => setIsOverlapDialogOpen(false)}>
        <DialogTitle>일정 겹침 경고</DialogTitle>
        <DialogContent>
          <DialogContentText>
            다음 일정과 겹칩니다:
            {overlappingEvents.map((event) => (
              <Typography key={event.id}>
                {event.title} ({event.date} {event.startTime}-{event.endTime})
              </Typography>
            ))}
            계속 진행하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOverlapDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            onClick={async () => {
              setIsOverlapDialogOpen(false);
              await saveEvent({
                id: editingEvent ? editingEvent.id : undefined,
                title,
                date,
                startTime,
                endTime,
                description,
                location,
                category,
                repeat: {
                  type: isRepeating ? repeatType : 'none',
                  interval: repeatInterval,
                  endDate: repeatEndDate || undefined,
                },
                notificationTime,
              });
              resetForm();
            }}
          >
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationPanel notifications={notifications} onDismiss={removeNotification} />
    </Box>
  );
}

export default App;
