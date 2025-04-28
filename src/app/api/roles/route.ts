import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    console.log('Fetched roles from database:', JSON.stringify(roles, null, 2));
    return NextResponse.json(roles);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
