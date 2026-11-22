"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { HomeLink, StatusScreen } from "@/components/StatusScreen";
import statusStyles from "@/components/StatusScreen.module.css";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusScreen
      title="Une erreur est survenue"
      message="Quelque chose s'est mal passé de notre côté. Réessaie, ou reviens à l'accueil."
      actions={
        <>
          <button type="button" className={statusStyles.btnSolid} onClick={reset}>
            Réessayer
          </button>
          <HomeLink variant="ghost">Retour à l&apos;accueil</HomeLink>
        </>
      }
    />
  );
}
