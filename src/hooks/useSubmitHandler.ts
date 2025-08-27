import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { Event, EventForm } from '../types';
import { useEventForm } from './useEventForm';
import { useEventOperations } from './useEventOperations';
import { findOverlappingEvents } from '../utils/eventOverlap';

export const useSubmitHandler = (
  formProps: ReturnType<typeof useEventForm>,
  eventOperations: ReturnType<typeof useEventOperations>
) => {
  const {
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
    editingEvent,
    resetForm,
  } = formProps;

  const { events, saveEvent } = eventOperations;

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const createEventDataFromForm = (): Event | EventForm => {
    return {
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
  };

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }
    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData = createEventDataFromForm();
    const overlapping = findOverlappingEvents(eventData, events);

    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      await saveEvent(eventData);
      resetForm();
    }
  };

  const confirmOverlap = async () => {
    const eventData = createEventDataFromForm();
    await saveEvent(eventData);
    resetForm();
    setIsOverlapDialogOpen(false);
  };

  const cancelOverlap = () => {
    setIsOverlapDialogOpen(false);
  };

  return {
    addOrUpdateEvent,
    isOverlapDialogOpen,
    overlappingEvents,
    confirmOverlap,
    cancelOverlap,
  };
};
