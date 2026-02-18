import React from 'react';
import { AppLayout } from '@/components/layout';
import { NotificationWatcher, ToastContainer } from '@/components/layout/NotificationWatcher';

const App: React.FC = () => {
  return (
    <>
      <AppLayout />
      <NotificationWatcher />
      <ToastContainer />
    </>
  );
};

export default App;
