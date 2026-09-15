import type { Metadata } from "next";
import { MentorClient } from "@/components/mentor-client";

export const metadata: Metadata = {
  title: "The Guide",
};

export default function MentorPage() {
  return <MentorClient />;
}
