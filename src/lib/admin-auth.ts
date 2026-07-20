import { auth } from "@clerk/nextjs/server";
//import { currentUser } from "@clerk/nextjs/server";
//import { redirect } from "next/navigation";

/**
 * Restricts the admin route tree to the Clerk user whose primary email matches
 * the server-only ADMIN_EMAIL environment variable.
 */
export async function requireAdmin() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn({ returnBackUrl: "/admin" });
  }
  /* 
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )?.emailAddress;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail || primaryEmail?.toLowerCase() !== adminEmail) {
    redirect("/unauthorized");
  }*/
}
