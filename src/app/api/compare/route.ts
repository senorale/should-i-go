import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const majorId = request.nextUrl.searchParams.get('majorId')
  if (!majorId) {
    return NextResponse.json({ error: 'majorId is required' }, { status: 400 })
  }

  try {
    const [major, medians] = await Promise.all([
      prisma.major.findUnique({
        where: { id: majorId },
        select: {
          id: true,
          name: true,
          occupations: {
            select: {
              relevance: true,
              occupation: {
                select: {
                  annual_salary: true,
                },
              },
            },
          },
        },
      }),
      prisma.tuitionMedian.findMany({
        where: { cohort: { in: ['public_in_state', 'private_nonprofit'] } },
        select: {
          cohort: true,
          label: true,
          sticker_annual: true,
          net_price_annual: true,
        },
      }),
    ])

    if (!major) {
      return NextResponse.json({ error: 'Major not found' }, { status: 404 })
    }

    const totalWeight = major.occupations.reduce((s, o) => s + o.relevance, 0)
    const weightedSalary =
      totalWeight > 0
        ? major.occupations.reduce(
            (s, o) => s + o.occupation.annual_salary * o.relevance,
            0
          ) / totalWeight
        : 0

    const publicInState = medians.find((m) => m.cohort === 'public_in_state')
    const privateNonprofit = medians.find((m) => m.cohort === 'private_nonprofit')

    return NextResponse.json({
      major: { id: major.id, name: major.name },
      weightedSalary: Math.round(weightedSalary),
      tuition: {
        publicInState: publicInState?.net_price_annual ?? publicInState?.sticker_annual ?? 0,
        privateNonprofit: privateNonprofit?.net_price_annual ?? privateNonprofit?.sticker_annual ?? 0,
      },
    })
  } catch (error) {
    console.error('Error fetching comparison data:', error)
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 })
  }
}
