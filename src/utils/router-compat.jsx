'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';

/**
 * Compatibility Link component mapping to next/link
 */
export const Link = React.forwardRef(({ to, href, children, ...props }, ref) => {
  const destination = to || href || '#';
  return (
    <NextLink href={destination} ref={ref} {...props}>
      {children}
    </NextLink>
  );
});
Link.displayName = 'Link';

/**
 * NavLink support mapping to next/link with active className detection
 */
export const NavLink = React.forwardRef(({ to, className, children, ...props }, ref) => {
  const pathname = usePathname();
  const isActive = pathname === to;

  const resolvedClassName = typeof className === 'function'
    ? className({ isActive })
    : className;

  return (
    <NextLink href={to} ref={ref} className={resolvedClassName} {...props}>
      {children}
    </NextLink>
  );
});
NavLink.displayName = 'NavLink';

/**
 * Compatibility useNavigate hook mapping to next/navigation useRouter
 */
export const useNavigate = () => {
  const router = useRouter();
  return (path, options) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
};

/**
 * Compatibility useLocation hook mapping to next/navigation usePathname
 */
export const useLocation = () => {
  const pathname = usePathname();
  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
  };
};

/**
 * Compatibility useParams hook mapping to next/navigation useParams
 */
export const useParams = () => {
  return useNextParams();
};

/**
 * Compatibility useSearchParams hook mapping to next/navigation useSearchParams
 */
export const useSearchParams = () => {
  const nextSearchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = React.useCallback((newParams) => {
    const params = new URLSearchParams(nextSearchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [nextSearchParams, router, pathname]);

  return [nextSearchParams, setSearchParams];
};

/**
 * Compatibility Navigate component for redirects
 */
export const Navigate = ({ to, replace }) => {
  const router = useRouter();

  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
};

/**
 * Compatibility Outlet component (just renders children in Next.js)
 */
export const Outlet = ({ children }) => {
  return <>{children}</>;
};
