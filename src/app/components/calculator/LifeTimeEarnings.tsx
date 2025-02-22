import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LifetimeEarningsProps {
  formatCurrencyWithSign: (value: number) => string;
  calculateEarningsDifference: () => number;
  calculateLifetimeEarnings: () => Array<{
    name: string;
    earnings: number;
    years: number;
  }>;
  formatCurrency: (value: number) => string;
  schoolYears: string;
  InfoTooltip: React.FC<{ content: string }>;
}

const LifetimeEarnings = ({
  formatCurrencyWithSign,
  calculateEarningsDifference,
  calculateLifetimeEarnings,
  formatCurrency,
  schoolYears,
  InfoTooltip
}: LifetimeEarningsProps) => {
  return(
    <div className="grid gap-4">
    <h3 className="font-semibold">
      Lifetime Earnings Comparison ({formatCurrencyWithSign(calculateEarningsDifference())})
      <InfoTooltip content="Comparison of total earnings over a 45-year career period. College path accounts for years spent in school." />
    </h3>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={calculateLifetimeEarnings()}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value)}
          width={100}
        />
        <Tooltip
          formatter={(value: any) => formatCurrency(value)}
          labelFormatter={(label) => `${label} (${calculateLifetimeEarnings().find(item => item.name === label)?.years} years)`}
        />
        <Bar dataKey="earnings" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
    <div className="text-sm text-muted-foreground">
      <p>Without College: {formatCurrency(calculateLifetimeEarnings()[0].earnings)} (45 years)</p>
      <p>With College: {formatCurrency(calculateLifetimeEarnings()[1].earnings)} ({45 - parseInt(schoolYears)} years)</p>
    </div>
  </div>
  )
}

export default LifetimeEarnings;