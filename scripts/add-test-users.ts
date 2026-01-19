import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test users data (cleaned up email addresses)
const testUsers = [
  { name: "Wendy Cloutier-Hearns", email: "woosker54@gmail.com" }, // fixed missing domain
  { name: "Meg Hewings", email: "mhewings@videotron.ca" },
  { name: "Angela Lutzenberger", email: "angeloulutz@gmail.com" }, // removed trailing comma
  { name: "Jacquelyn Panek", email: "jacquelypanek@gmail.com" }, // removed @ prefix and comma
  { name: "Don Adams", email: "don.adams@sympatico.ca" },
  { name: "Patrick St-Amant", email: "stamantpatrick@gmail.com" },
  { name: "Zodpa Nyima", email: "zodpanyima@gmail.com" },
  { name: "David Secondo", email: "dsecondo2009@gmail.com" },
];

async function main() {
  console.log("Adding test users...\n");

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipped: ${userData.name} (${userData.email}) - already exists`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: "PARTICIPANT",
          profileCompleted: false,
        },
      });

      console.log(`✅ Created: ${user.name} (${user.email}) - ID: ${user.id}`);
    } catch (error: any) {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
    }
  }

  console.log("\n✨ Done!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
