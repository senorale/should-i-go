import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as CollegeConstants from '@/app/constants/college_related_constants';

const STUDENT_LOAN_CALCULATION_LINK = "https://studentaid.gov/understand-aid/types/loans/interest-rates"

const formatCurrencyWithCents = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip p-2 border border-gray-300 rounded shadow-md" style={{backgroundColor: '#FAFAFA', padding: '10px'}}>
        <p className="text-sm font-semibold">{`${data.name}: ${formatCurrencyWithCents(data.value)}`}</p>
      </div>
    );
  }
  return null;
};

interface MedianTotalCostProps {
  medianTotalCost: number;
  medianInterestCost: number;
  medianOpportunityCost: number;
  COLORS: string[];
  InfoTooltip: React.ComponentType<{
    content: string;
    footerLink?: string;
  }>;
  hasSelectedOccupation?: boolean;
  occupationTotalCost?: number;
  occupationName?: string;
}

const MedianTotalCost = ({
  medianTotalCost,
  medianInterestCost,
  medianOpportunityCost,
  COLORS,
  InfoTooltip,
}: MedianTotalCostProps) => {

  const data = [
    { name: "Tuition Cost", value: CollegeConstants.MEDIAN_TOTAL_TUITION_COST },
    { name: "Loan Interest Cost", value: medianInterestCost },
    { name: "Opportunity Cost", value: medianOpportunityCost },
  ];
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="font-semibold">Total Cost</h3>
        <p className="text-4xl font-bold">{formatCurrencyWithCents(medianTotalCost)}</p>
      </div>
      <div className="grid gap-2">
        <h3 className="font-semibold">Cost Breakdown</h3>
        <p>
          Total Tuition Cost: {formatCurrencyWithCents(CollegeConstants.MEDIAN_TOTAL_TUITION_COST)}
          <InfoTooltip content="The direct cost of attending college." />
        </p>
        <p>
          Loan Interest Cost: {formatCurrencyWithCents(medianInterestCost)}
          <InfoTooltip content="The total interest paid on your student loans assuming a 10 year loan. Uses daily simple interest. See more on how this is calculated here:" footerLink={STUDENT_LOAN_CALCULATION_LINK} />
        </p>
        <p>
          Opportunity Cost: {formatCurrencyWithCents(medianOpportunityCost)}
          <InfoTooltip 
            content={`The income you could have earned if you worked instead of attending college for ${CollegeConstants.BACHELOR_YEARS_IN_SCHOOL} year${parseInt(CollegeConstants.BACHELOR_YEARS_IN_SCHOOL) !== 1 ? 's' : ''}.`}
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

export default MedianTotalCost;