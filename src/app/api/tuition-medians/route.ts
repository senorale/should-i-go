import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Order cohorts cheapest-realistic first so the UI can present a sensible range.
const COHORT_ORDER = [
  'public_in_state',
  'public_out_of_state',
  'private_nonprofit',
  'all',
]

export async function GET() {
  try {
    const medians = await prisma.tuitionMedian.findMany({
      select: {
        cohort: true,
        label: true,
        sticker_annual: true,
        net_price_annual: true,
        cost_of_attendance_annual: true,
        sample_size: true,
        source: true,
      },
    })

    medians.sort(
      (a, b) => COHORT_ORDER.indexOf(a.cohort) - COHORT_ORDER.indexOf(b.cohort)
    )

    return NextResponse.json(medians)
  } catch (error) {
    console.error('Error fetching tuition medians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tuition medians' },
      { status: 500 }
    )
  }
}
