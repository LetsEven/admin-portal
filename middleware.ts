import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentPath = req.nextUrl.pathname;

  // If user is not signed in and trying to access a protected route
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', currentPath);
    return NextResponse.redirect(signInUrl);
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (userId && (currentPath === '/sign-in' || currentPath === '/sign-up')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};