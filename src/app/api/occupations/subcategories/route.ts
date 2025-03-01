export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const subcategories = await prisma.occupationSubCategory.findMany({
      where: {
        category_id: categoryId,
      },
      select: {
        id: true,
        name: true,
        annual_salary: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
} 