/* eslint-disable no-unused-vars */
import Close from '@mui/icons-material/Close';
import { Alert, AlertTitle, IconButton, Stack } from '@mui/material';

interface NotificationPanelProps {
  notifications: { id: string; message: string }[];
  onDismiss: (index: number) => void;
}

export const NotificationPanel = ({ notifications, onDismiss }: NotificationPanelProps) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <Stack
      position="fixed"
      top={16}
      right={16}
      spacing={2}
      alignItems="flex-end"
      sx={{ zIndex: 1500 }}
    >
      {notifications.map((notif, index) => (
        <Alert
          key={notif.id}
          severity="info"
          sx={{ width: 'auto' }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => onDismiss(index)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <AlertTitle>{notif.message}</AlertTitle>
        </Alert>
      ))}
    </Stack>
  );
};
