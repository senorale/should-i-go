import React from 'react';
import * as CollegeConstants from '@/app/constants/college_related_constants';

interface MedianTotalCostProps {
  medianTotalCost: number;
  medianInterestCost: number;
  medianOpportunityCost: number;
  medianBreakEvenYears: number | string;
  COLORS: string[];
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

export default function MedianTotalCost({
  medianTotalCost,
  medianInterestCost,
  medianOpportunityCost,
  medianBreakEvenYears,
  COLORS,
  InfoTooltip
}: MedianTotalCostProps) {

  // Round numbers to nearest whole number
  const roundedTuitionCost = Math.round(CollegeConstants.MEDIAN_TOTAL_TUITION_COST);
  const roundedInterestCost = Math.round(medianInterestCost);
  const roundedOpportunityCost = Math.round(medianOpportunityCost);
  const roundedTotalCost = Math.round(medianTotalCost);

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">
          Median College Cost
        </h3>
        <InfoTooltip content="This shows the median cost of a 4-year college education, including tuition, interest on loans, and opportunity cost." />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Tuition Cost
          <InfoTooltip 
              content="Finding a median or average tuition cost from a reliable, unbiased, & citable source has proven a difficult task. This number is completely arbitrary. If you think you have a source we can use, please reach out."
              footerLink={"alejandrocarvajalt@outlook.com"}
            />
          </div>
          <div className="text-xl font-bold" style={{ color: COLORS[0] }}>
            ${roundedTuitionCost.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            Interest Cost
            <InfoTooltip 
              content="The total interest paid on your student loans assuming a 10 year loan. Uses daily simple interest. See more on how this is calculated here:"
              footerLink={CollegeConstants.STUDENT_LOAN_CALCULATION_LINK}
            />
          </div>
          <div className="text-xl font-bold" style={{ color: COLORS[1] }}>
            ${roundedInterestCost.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Opportunity Cost
            <InfoTooltip 
              content="The income you could have earned if you worked instead of attending college for 4 years."
            />
          </div>
          <div className="text-xl font-bold" style={{ color: COLORS[2] }}>
            ${roundedOpportunityCost.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-muted-foreground text-center">Total Cost</div>
        <div className="text-2xl font-bold text-center">
          ${roundedTotalCost.toLocaleString()}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm text-muted-foreground">Break-Even Point</div>
          <InfoTooltip content="The number of years it takes for the higher income from a college degree to offset the total cost of college." />
        </div>
        <div className="text-xl font-bold text-center">
          {typeof medianBreakEvenYears === 'number' ? `${Math.round(medianBreakEvenYears * 10) / 10} years` : 'N/A'}
        </div>
      </div>
    </div>
  );
}