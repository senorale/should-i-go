import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Search query must be at least 3 characters' }, { status: 400 })
    }

    const subcategories = await prisma.occupationSubCategory.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive'  
        }
      },
      select: {
        id: true,
        name: true,
        annual_salary: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 10  // Limit results
    })
    
    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error searching subcategories:', error)
    return NextResponse.json({ error: 'Failed to search subcategories' }, { status: 500 })
  }
} 