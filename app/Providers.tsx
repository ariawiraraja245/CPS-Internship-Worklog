"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function SessionEnforcer({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    // Only enforce on protected routes (not login/register)
    if (pathname === "/login" || pathname === "/register") {
      setIsValidated(true);
      return;
    }

    if (status === "authenticated") {
      const isTabSessionActive = sessionStorage.getItem("cilok_tab_session");
      if (!isTabSessionActive) {
        // Tab was closed and reopened, or new tab opened
        signOut({ callbackUrl: "/login" });
      } else {
        setIsValidated(true);
      }
    } else if (status === "unauthenticated") {
      setIsValidated(true);
    }
  }, [status, pathname]);

  if (!isValidated && status === "authenticated") {
    return null; // Prevent flicker before logging out
  }

  return <>{children}</>;
}

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionEnforcer>
        <Toaster position="top-right" />
        {children}
      </SessionEnforcer>
    </SessionProvider>
  );
}
