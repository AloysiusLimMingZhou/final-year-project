import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const roles = ['user', 'doctor', 'admin']

    for (const roleName of roles) {
        await prisma.roles.upsert({
            where: { name: roleName },
            update: {},
            create: {
                name: roleName
            }
        })
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

