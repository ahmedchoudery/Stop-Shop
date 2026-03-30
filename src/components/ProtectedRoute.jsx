/**
 * @fileoverview Protected Route — verifies admin auth before rendering children
 * Applies: react-patterns (single responsibility), react-ui-patterns (proper loading state),
 *          nodejs-best-practices (security: actually validate auth token)
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

/**
 * Auth state:
 * - null: still checking
 * - true: authenticated
 * - false: not authenticated
 *
 * @param {{ children: React.ReactNode }} props
 */
const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState(null); // null = loading
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      try {
        // Use an authenticated endpoint rather than /api/health
        // which doesn't actually verify the token
        const res = await authFetch(apiUrl('/api/admin/users'));

        if (!cancelled) {
          setAuthState(res.ok);
        }
      } catch {
        if (!cancelled) setAuthState(false);
      }
    };

    verifyAuth();

    return () => { cancelled = true; };
  }, []);

  // Loading state — show spinner, not stale content
  if (authState === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ba1f3d]" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!authState) {
    // Save attempted URL for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;