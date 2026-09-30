"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Dialog } from "./primitives";

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  /** Destructive actions get a red confirm button. Defaults to true. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** One confirmation dialog for the whole Product section: `await confirm({...})` resolves true/false. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    resolver.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const destructive = options?.destructive ?? true;
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!options}
        onClose={() => close(false)}
        title={
          <span className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-4 w-4 text-pm-warning" aria-hidden />}
            {options?.title}
          </span>
        }
        width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)} data-autofocus>
              Cancel
            </Button>
            <Button variant={destructive ? "danger" : "primary"} onClick={() => close(true)}>
              {options?.confirmLabel ?? "Delete"}
            </Button>
          </>
        }
      >
        <div className="text-sm text-pm-text">{options?.message}</div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
