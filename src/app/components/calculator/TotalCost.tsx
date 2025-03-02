import React from 'react';
import MedianTotalCost from './MedianTotalCost';
import SpecificTotalCost from './SpecificTotalCost';

interface TotalCostProps {
  hasSelectedOccupation: boolean;
  medianTotalCost: number;
  medianInterestCost: number;
  medianOpportunityCost: number;
  medianBreakEvenYears: number | string;
  specificBreakEvenYears: number | string;
  tuition: number;
  loan: number;
  interest: string;
  schoolYears: string;
  occupationName: string;
  COLORS: string[];
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

export default function TotalCost({
  hasSelectedOccupation,
  medianTotalCost,
  medianInterestCost,
  medianOpportunityCost,
  medianBreakEvenYears,
  specificBreakEvenYears,
  tuition,
  loan,
  interest,
  schoolYears,
  occupationName,
  COLORS,
  InfoTooltip
}: TotalCostProps) {
  return (
    <div className="space-y-4">
      <MedianTotalCost 
        medianTotalCost={medianTotalCost}
        medianInterestCost={medianInterestCost}
        medianOpportunityCost={medianOpportunityCost}
        medianBreakEvenYears={medianBreakEvenYears}
        COLORS={COLORS}
        InfoTooltip={InfoTooltip}
      />
      
      {hasSelectedOccupation && (
        <SpecificTotalCost
          tuition={tuition}
          loan={loan}
          interest={interest}
          schoolYears={schoolYears}
          occupationName={occupationName}
          specificBreakEvenYears={specificBreakEvenYears}
          COLORS={COLORS}
          InfoTooltip={InfoTooltip}
        />
      )}
    </div>
  );
} 