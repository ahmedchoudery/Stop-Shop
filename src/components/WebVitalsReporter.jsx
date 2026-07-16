'use client';

import { useReportWebVitals } from 'next/navigation';

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify(metric);
    const url = '/api/analytics/vitals';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true });
    }
  });

  return null;
}
