import { Box, Stack } from '@mui/material';

import { CalendarView } from './components/CalendarView';
import { EventFormPanel } from './components/EventFormPanel';
import { EventListPanel } from './components/EventListPanel';
import { NotificationPanel } from './components/NotificationPanel';
import { OverlapWarningDialog } from './components/OverlapWarningDialog';
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

      <OverlapWarningDialog
        isOpen={isOverlapDialogOpen}
        overlappingEvents={overlappingEvents}
        onConfirm={confirmOverlap}
        onCancel={cancelOverlap}
      />

      <NotificationPanel
        notifications={notificationProps.notifications}
        onDismiss={notificationProps.removeNotification}
      />
    </Box>
  );
}

export default App;
