import { Suspense } from "react";
import type { PropsWithChildren } from "react";
import AlertSSEProvider from "./sse";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={null}>
      <AlertSSEProvider>{children}</AlertSSEProvider>
    </Suspense>
  );
}
