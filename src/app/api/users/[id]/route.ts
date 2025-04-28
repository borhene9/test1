import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface Params {
  id: string;
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    const { roleId, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const data: any = {};

    if (roleId) {
      data.roleId = roleId;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      data.password = passwordHash;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Missing role ID or password' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: data,
      include: {
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
} 