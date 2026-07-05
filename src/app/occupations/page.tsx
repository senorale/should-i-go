import type { Metadata } from 'next'
import CompareOccupations from './CompareOccupations'

export const metadata: Metadata = {
  title: 'Compare Occupations · Should I Go To School?',
}

export default function OccupationsPage() {
  return <CompareOccupations />
}
