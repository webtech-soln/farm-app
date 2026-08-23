"use client";

import { createContext, useContext } from "react";

import type { Capability } from "@/lib/auth/permissions";

/**
 * The signed-in role's capabilities, mirrored to the client so a person is not
 * shown a button that the Server Action would only refuse. The action still
 * checks for itself — this is presentation, not security.
 */
const CapabilityContext = createContext<Capability[]>([]);

export const CapabilityProvider = CapabilityContext.Provider;

export function useCan(capability?: Capability) {
  const capabilities = useContext(CapabilityContext);
  if (!capability) return true;
  return capabilities.includes(capability);
}
