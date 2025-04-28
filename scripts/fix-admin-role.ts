import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminRole = await prisma.role.update({
      where: {
        id: '749ba017-4ab7-47a0-928e-efcf6d1c343f',
      },
      data: {
        name: 'admin',
      },
    });
    console.log('Admin role updated:', adminRole);
  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 