import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be visited while signed out
  publicRoutes: ["/sign-in", "/sign-up"],

  // Force redirect to sign-in for protected routes
  afterAuth(auth, req) {
    // If user is not signed in and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (auth.userId && (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up")) {
      const dashboard = new URL("/", req.url);
      return Response.redirect(dashboard);
    }
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};