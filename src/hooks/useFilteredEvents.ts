import { useMemo, useState } from 'react';

import { Event } from '../types';
import { getEventsForView } from '../utils/recurringEvents';

export const useFilteredEvents = (events: Event[], currentDate: Date, view: 'week' | 'month') => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = useMemo(() => {
    let viewStartDate: Date;
    let viewEndDate: Date;

    if (view === 'week') {
      const currentDay = currentDate.getDay();

      const firstDay = new Date(currentDate);
      firstDay.setDate(currentDate.getDate() - currentDay);

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);

      viewStartDate = firstDay;
      viewEndDate = lastDay;
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      viewStartDate = new Date(year, month, 1);
      viewEndDate = new Date(year, month + 1, 0);
    }

    const eventsInView = getEventsForView(events, viewStartDate, viewEndDate);

    if (!searchTerm) {
      return eventsInView;
    }

    return eventsInView.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [events, searchTerm, currentDate, view]);

  return {
    searchTerm,
    setSearchTerm,
    filteredEvents,
  };
};
