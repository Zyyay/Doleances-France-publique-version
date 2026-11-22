import type { Metadata } from "next";
import { HomeLink, StatusScreen } from "@/components/StatusScreen";

export const metadata: Metadata = {
  title: "Page introuvable — Doléances",
};

export default function NotFound() {
  return (
    <StatusScreen
      title="Page introuvable"
      message="Cette page n'existe pas ou n'est plus disponible."
      actions={<HomeLink>Retour à l&apos;accueil</HomeLink>}
    />
  );
}
