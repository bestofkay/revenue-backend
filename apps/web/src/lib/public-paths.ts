/** Paths that must work without admin authentication. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/pay' ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/receipts/')
  );
}
