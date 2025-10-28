import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (value: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
} | null>(null);

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>{children}</DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error("DropdownMenuTrigger deve estar dentro de DropdownMenu");
    return (
      <button
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          context.triggerRef.current = node;
        }}
        onClick={(event) => {
          props.onClick?.(event);
          context.setOpen(!context.open);
        }}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900",
          props.className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const context = React.useContext(DropdownContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleClick = (event: MouseEvent) => {
      if (!context?.open) return;
      const target = event.target as Node;
      if (context.triggerRef.current && context.triggerRef.current.contains(target)) return;
      context?.setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [context]);

  if (!context || !context.open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "z-50 mt-2 min-w-[180px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900",
        className
      )}
      style={{
        position: "absolute",
        top: context.triggerRef.current?.getBoundingClientRect().bottom ?? 0,
        left: context.triggerRef.current?.getBoundingClientRect().left ?? 0,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export const DropdownMenuItem = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const context = React.useContext(DropdownContext);
  return (
    <button
      onClick={(event) => {
        props.onClick?.(event);
        context?.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
