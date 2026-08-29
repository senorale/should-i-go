import type { Metadata } from 'next'
import CompareMajors from './CompareMajors'

export const metadata: Metadata = {
  title: 'Compare Majors · Should I Go To School?',
}

export default function MajorsPage() {
  return <CompareMajors />
}
