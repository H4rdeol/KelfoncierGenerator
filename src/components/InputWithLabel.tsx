/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** InputWithLabel.tsx
*/

import { useState } from "react"

export function InputWithLabel({
  label,
  id,
  placeholder,
  onSubmit,
  onValueChange,
  isError = false
}: {
  label: string,
  id: string,
  placeholder?: string,
  onSubmit?: (value: string) => void,
  onValueChange?: (value: string) => void,
  isError?: boolean
}) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onValueChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit?.(value);
    }
  };

  return (
    <div className="flex flex-col space-y-1 px-2">
      <label htmlFor={id} className={`text-left font-medium ${isError ? "text-red-500" : ""}`}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          h-10
          with-border
          max-w-xs
          border-blue-300
          rounded px-3 py-2
          transition-colors focus:outline-none focus:ring-2
          ${isError ? "error" : ""}
        `}
      />
    </div>
  );
}
