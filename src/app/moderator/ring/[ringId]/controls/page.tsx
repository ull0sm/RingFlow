import React from "react";
import ModeratorControlsClient from "@/components/moderator/ModeratorControlsClient";

export default async function ModeratorControlsPage({ params }: { params: Promise<{ ringId: string }> }) {
  const { ringId } = await params;
  return <ModeratorControlsClient ringId={ringId} />;
}
