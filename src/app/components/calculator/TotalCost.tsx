import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TotalCostProps {
  formatCurrencyWithCents: (value: number) => string;
  totalCost: number;
  tuition: number;
  loanInterest: number;
  opportunityCost: number;
  schoolYears: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  CustomTooltip: React.ComponentType<any>;
  COLORS: string[];
  InfoTooltip: React.ComponentType<{
    content: string;
    footerLink?: string;
  }>;
  STUDENT_LOAN_CALCULATION_LINK: string;
}

const TotalCost = ({
  formatCurrencyWithCents,
  totalCost,
  tuition,
  loanInterest,
  opportunityCost,
  data,
  schoolYears,
  CustomTooltip,
  COLORS,
  InfoTooltip,
  STUDENT_LOAN_CALCULATION_LINK
}: TotalCostProps) => {
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="font-semibold">Total Cost</h3>
        <p className="text-4xl font-bold">{formatCurrencyWithCents(totalCost)}</p>
      </div>
      <div className="grid gap-2">
        <h3 className="font-semibold">Cost Breakdown</h3>
        <p>
          Tuition: {formatCurrencyWithCents(tuition)}
          <InfoTooltip content="The direct cost of attending college." />
        </p>
        <p>
          Loan Interest: {formatCurrencyWithCents(loanInterest)}
          <InfoTooltip content="The total interest paid on your student loans assuming a 10 year loan. Uses daily simple interest. See more on how this is calulated here:" footerLink={STUDENT_LOAN_CALCULATION_LINK} />
        </p>
        <p>
          Opportunity Cost: {formatCurrencyWithCents(opportunityCost)}
          <InfoTooltip 
            content={`The income you could have earned if you worked instead of attending college for ${schoolYears} year${parseInt(schoolYears) !== 1 ? 's' : ''}.`}
          />
        </p>
      </div>
      <div className="grid gap-4">
        <h3 className="font-semibold">Cost Breakdown Chart</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TotalCost;