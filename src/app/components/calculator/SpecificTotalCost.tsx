import React from 'react';
import { calculateTotalInterestPaid } from '../../utils';
import * as CollegeConstants from '@/app/constants/college_related_constants';

interface SpecificTotalCostProps {
  tuition: number;
  loan: number;
  interest: string;
  schoolYears: string;
  occupationName: string;
  specificBreakEvenYears: number | string;
  COLORS: string[];
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

export default function SpecificTotalCost({
  tuition,
  loan,
  interest,
  schoolYears,
  occupationName,
  COLORS,
  specificBreakEvenYears,
  InfoTooltip
}: SpecificTotalCostProps) {
  
  const specificInterestCost = parseFloat(calculateTotalInterestPaid(
    loan, 
    parseFloat(interest || '0'), 
    10
  ));
  
  const specificOpportunityCost = CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY * 
    parseFloat(schoolYears || '0');
  
  const specificTotalCost = tuition + specificInterestCost + specificOpportunityCost;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">
          Cost for {occupationName} Career Path
        </h3>
        <InfoTooltip content="This shows the estimated total cost based on your specific inputs and selected occupation." />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Tuition</div>
          <div className="text-xl font-bold" style={{ color: COLORS[0] }}>
            ${tuition.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            Interest
            <InfoTooltip 
              content="The total interest paid on your student loans assuming a 10 year loan. Uses daily simple interest. See more on how this is calculated here:"
              footerLink={CollegeConstants.STUDENT_LOAN_CALCULATION_LINK}
            />
          </div>
          <div className="text-xl font-bold" style={{ color: COLORS[1] }}>
            ${specificInterestCost.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Opportunity Cost</div>
          <div className="text-xl font-bold" style={{ color: COLORS[2] }}>
            ${specificOpportunityCost.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm text-muted-foreground">Total Cost</div>
        <div className="text-2xl font-bold">
          ${specificTotalCost.toLocaleString()}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm text-muted-foreground">Break-Even Point</div>
          <InfoTooltip content="The number of years it takes for the higher income from a college degree to offset the total cost of college." />
        </div>
        <div className="text-xl font-bold text-center">
          {typeof specificBreakEvenYears === 'number' ? `${specificBreakEvenYears.toFixed(1)} years` : 'N/A'}
        </div>
      </div>
    </div>
  );
}