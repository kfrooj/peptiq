"use client";

type Props = {
  stackName: string;
};

export default function DeleteStackButton({ stackName }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const confirmed = window.confirm(
          `Delete "${stackName}"? This cannot be undone.`
        );

        if (!confirmed) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
    >
      Delete
    </button>
  );
}