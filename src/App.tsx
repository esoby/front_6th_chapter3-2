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

import { CalendarView } from './components/CalendarView';
import { EventFormPanel } from './components/EventFormPanel';
import { EventListPanel } from './components/EventListPanel';
import { NotificationPanel } from './components/NotificationPanel';
import { useCalendarView } from './hooks/useCalendarView';
import { useEventForm } from './hooks/useEventForm';
import { useEventOperations } from './hooks/useEventOperations';
import { useFilteredEvents } from './hooks/useFilteredEvents';
import { useNotifications } from './hooks/useNotifications';
import { useSubmitHandler } from './hooks/useSubmitHandler';

function App() {
  const formProps = useEventForm();
  const eventOperations = useEventOperations(Boolean(formProps.editingEvent), () => {
    formProps.setEditingEvent(null);
    formProps.resetForm();
  });
  const calendarViewProps = useCalendarView();
  const notificationProps = useNotifications(eventOperations.events);
  const filteredEventsProps = useFilteredEvents(
    eventOperations.events,
    calendarViewProps.currentDate,
    calendarViewProps.view
  );

  const {
    addOrUpdateEvent,
    isOverlapDialogOpen,
    overlappingEvents,
    confirmOverlap,
    cancelOverlap,
  } = useSubmitHandler(formProps, eventOperations);

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <EventFormPanel formProps={{ ...formProps, addOrUpdateEvent }} />
        <CalendarView
          viewProps={{
            ...calendarViewProps,
            ...filteredEventsProps,
            ...notificationProps,
            editEvent: formProps.editEvent,
          }}
        />
        <EventListPanel
          listProps={{
            ...filteredEventsProps,
            ...notificationProps,
            editEvent: formProps.editEvent,
            deleteEvent: eventOperations.deleteEvent,
          }}
        />
      </Stack>

      <Dialog open={isOverlapDialogOpen} onClose={cancelOverlap}>
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
          <Button onClick={cancelOverlap}>취소</Button>
          <Button color="error" onClick={confirmOverlap}>
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationPanel
        notifications={notificationProps.notifications}
        onDismiss={notificationProps.removeNotification}
      />
    </Box>
  );
}

export default App;
