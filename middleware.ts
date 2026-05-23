import { NextRequest, NextResponse } from "next/server";

const publicFilePattern = /\.(?:css|js|ico|png|jpg|jpeg|webp|svg|woff2?)$/i;

export function middleware(request: NextRequest) {
  const username = process.env.APP_USERNAME || "admin";
  const password = process.env.APP_PASSWORD;

  if (!password || isPublicRequest(request)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");

  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");

    if (scheme === "Basic" && encoded) {
      const [givenUsername, givenPassword] = atob(encoded).split(":");

      if (givenUsername === username && givenPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Desert Estate Watch"'
    }
  });
}

function isPublicRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    publicFilePattern.test(pathname)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
