import * as React from "react";
import { Input } from "@/components/ui/input";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(({ value, onChange, ...props }, ref) => {
  return (
    <Input
      type="date"
      value={value}
      ref={ref}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  );
});
DatePicker.displayName = "DatePicker";
