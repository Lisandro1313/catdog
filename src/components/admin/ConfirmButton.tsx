"use client";

/** Botón de submit que pide confirmación antes de mandar el form. */
export function ConfirmButton({
  children,
  message,
  className = "btn btn-danger btn-sm",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
