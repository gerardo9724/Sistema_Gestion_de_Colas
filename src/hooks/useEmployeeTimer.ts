import { useState, useEffect } from 'react';
import type { Ticket } from '../types';

export function useEmployeeTimer(ticket: Ticket | undefined) {
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Update service start time when ticket changes
  useEffect(() => {
    if (ticket?.servedAt) {
      setServiceStartTime(new Date(ticket.servedAt));
      setIsTimerRunning(true);
    } else {
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
    }
  }, [ticket?.id, ticket?.servedAt]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && serviceStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - serviceStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, serviceStartTime]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  return {
    elapsedTime,
    isTimerRunning,
    handleToggleTimer
  };
}