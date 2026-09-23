"use client";

/** Botón de submit que pide confirmación antes de mandar el form. */
export function ConfirmButton({
  children,
  message,
  className = "btn btn-danger btn-sm",
  disabled,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
