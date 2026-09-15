import type { Metadata } from "next";
import { QuestsClient } from "@/components/quests-client";

export const metadata: Metadata = {
  title: "Quest log",
};

export default function QuestsPage() {
  return <QuestsClient />;
}
