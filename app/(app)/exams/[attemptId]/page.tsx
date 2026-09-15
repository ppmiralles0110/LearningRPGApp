import type { Metadata } from "next";
import { ExamClient } from "@/components/exam-client";

export const metadata: Metadata = {
  title: "Practice exam",
};

export default async function ExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <ExamClient attemptId={attemptId} />;
}
