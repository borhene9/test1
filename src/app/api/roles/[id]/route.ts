import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    await prisma.role.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { name } = await request.json();

    // Special case for admin role
    if (id === '749ba017-4ab7-47a0-928e-efcf6d1c343f') {
      const updatedRole = await prisma.role.update({
        where: {
          id: id,
        },
        data: {
          name: 'admin',
        },
      });
      return NextResponse.json(updatedRole);
    }

    const updatedRole = await prisma.role.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    });
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
