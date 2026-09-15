import type { Metadata } from "next";
import { CertificationsClient } from "@/components/certifications-client";

export const metadata: Metadata = {
  title: "Certifications",
};

export default function CertificationsPage() {
  return <CertificationsClient />;
}
