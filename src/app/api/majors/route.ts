export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const majors = await prisma.major.findMany({
      select: {
        id: true,
        name: true,
        occupations: {
          select: {
            relevance: true,
            occupation: {
              select: {
                id: true,
                name: true,
                annual_salary: true,
              },
            },
          },
          orderBy: { relevance: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(majors)
  } catch (error) {
    console.error('Error fetching majors:', error)
    return NextResponse.json({ error: 'Failed to fetch majors' }, { status: 500 })
  }
}
