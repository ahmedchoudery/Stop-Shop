import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    fetch(apiUrl('/api/public/settings'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.announcement) setAnnouncement(data.announcement);
      })
      .catch(() => {}); // Silently fail — never crash the page
  }, []);

  if (!announcement) return null;

  return (
    <div className="bg-yellow-400 py-2.5 px-4">
      <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-red-950 text-center flex items-center justify-center">
        <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full mr-3 animate-pulse"></span>
        {announcement}
        <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full ml-3 animate-pulse"></span>
      </p>
    </div>
  );
};

export default AnnouncementBar;
