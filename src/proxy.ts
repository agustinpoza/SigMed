import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { devAuthEmail } from "@/lib/dev-auth";

const clerk = clerkMiddleware();

// Con el bypass de desarrollo activo (ver lib/dev-auth.ts) no se pasa por Clerk.
export default devAuthEmail() ? () => NextResponse.next() : clerk;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
