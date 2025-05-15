import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, roleId } = await request.json();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username,
        password: passwordHash,
        roleId: roleId,
      },
      include: {
        role: true,
      },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      // Unique constraint failed
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    await prisma.user.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
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
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
