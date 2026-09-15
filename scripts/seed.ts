import { createDatabase } from "@/lib/db";

const db = createDatabase();
const counts = {
  domains: db.prepare("SELECT COUNT(*) AS count FROM domains").get() as {
    count: number;
  },
  quests: db.prepare("SELECT COUNT(*) AS count FROM quest_templates").get() as {
    count: number;
  },
  certifications: db
    .prepare("SELECT COUNT(*) AS count FROM certifications")
    .get() as { count: number },
};

console.log(
  `Seeded ${counts.domains.count} domains, ${counts.quests.count} quests, and ${counts.certifications.count} certifications.`,
);
db.close();
