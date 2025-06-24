import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export function useEmployeeQueueStats(employeeId: string) {
  const { getEmployeeQueueStats } = useApp();
  const [stats, setStats] = useState({
    personalQueueCount: 0,
    generalQueueCount: 0,
    totalWaitingCount: 0,
    nextTicketType: 'none' as 'personal' | 'general' | 'none'
  });

  useEffect(() => {
    if (!employeeId) return;

    const loadStats = async () => {
      try {
        const employeeStats = await getEmployeeQueueStats(employeeId);
        setStats(employeeStats);
      } catch (error) {
        console.error('Error loading employee queue stats:', error);
      }
    };

    loadStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [employeeId, getEmployeeQueueStats]);

  return stats;
}