"use client";

import { useTransition } from "react";
import { deleteNewsAction } from "@/app/admin/(protected)/novidades/actions";

export function DeleteNewsButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Apagar "${title}"? Não é possível desfazer.`)) return;
    startTransition(() => deleteNewsAction(id));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="ml-4 text-sm font-medium text-brand-red hover:underline disabled:opacity-50"
    >
      {pending ? "A apagar…" : "Apagar"}
    </button>
  );
}
