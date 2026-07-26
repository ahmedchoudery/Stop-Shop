'use client';

import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify(metric);
    const url = '/api/v1/analytics/vitals';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true });
    }
  });

  return null;
}
