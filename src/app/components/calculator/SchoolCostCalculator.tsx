'use client'
import React, { useState } from 'react';
import { calculateTotalInterestPaid, calculateBreakEvenYears } from '../../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import LifetimeEarnings from './LifeTimeEarnings';
import Disclaimer from './Disclaimer';
import { InfoTooltip } from './InfoTooltip';
import SchoolCostForm from './SchoolCostForm';
import TotalCost from './TotalCost';
import * as CollegeConstants from '@/app/constants/college_related_constants';


const GITHUB_LINK = "https://github.com/mikebranc/should-i-go"


export default function SchoolCostCalculator() {
  const [tuition, setTuition] = useState(50000);
  const [loan, setLoan] = useState(40000);
  // interest is a string to allow an empty input
  const [interest, setInterest] = useState<string>('8');
  // schoolYears is a string to allow an empty input
  const [schoolYears, setSchoolYears] = useState<string>('4');
  
  const [hasSelectedOccupation, setHasSelectedOccupation] = useState(false);
  const [occupationSalary, setOccupationSalary] = useState(0);
  const [occupationName, setOccupationName] = useState('');
  
  // Calculate median costs using constants
  const medianInterestCost = parseFloat(calculateTotalInterestPaid(
    CollegeConstants.MEDIAN_TOTAL_LOAN_AMOUNT, 
    parseFloat(CollegeConstants.STUDENT_LOAN_INTEREST_RATE), 
    10
  ));
  
  const medianOpportunityCost = CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY * 
  parseFloat(CollegeConstants.BACHELOR_YEARS_IN_SCHOOL);
  
  const medianTotalCost = CollegeConstants.MEDIAN_TOTAL_TUITION_COST + 
    medianInterestCost + 
    medianOpportunityCost;
  
  const medianBreakEvenYears = calculateBreakEvenYears(
    medianTotalCost,
    CollegeConstants.BACHELOR_DEGREE_MEDIAN_SALARY,
    CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY
  );

  const specificInterestCost = parseFloat(calculateTotalInterestPaid(
    loan, 
    parseFloat(interest), 
    10
  ));
  const specificOpportunityCost = occupationSalary * 
      parseFloat(schoolYears);
  
  const specificTotalCost = tuition + 
    specificInterestCost + 
    specificOpportunityCost;
    
  const specificBreakEvenYears = calculateBreakEvenYears(
      specificTotalCost,
      occupationSalary,
      CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY
    );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCurrencyInput = (value: string, setter: React.Dispatch<React.SetStateAction<number>>) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setter(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleInterestInput = (value: string) => {
    // Allow empty input, digits, and up to one decimal point
    const regex = /^$|^\d*\.?\d*$/;
    if (regex.test(value) && (value === '' || parseFloat(value) <= 100)) {
      setInterest(value);
    }
  };

  const handleSchoolYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setSchoolYears(value);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle>School Cost Calculator</CardTitle>
        <CardDescription>Calculate the true cost of going to school</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SchoolCostForm
          tuition={tuition}
          loan={loan}
          interest={interest}
          schoolYears={schoolYears}
          formatCurrency={formatCurrency}
          handleCurrencyInput={handleCurrencyInput}
          handleInterestInput={handleInterestInput}
          handleSchoolYearsChange={handleSchoolYearsChange}
          setTuition={setTuition}
          setLoan={setLoan}
          setInterest={setInterest}
          setSchoolYears={setSchoolYears}
          hasSelectedOccupation={hasSelectedOccupation}
          setHasSelectedOccupation={setHasSelectedOccupation}
          occupationSalary={occupationSalary}
          setOccupationSalary={setOccupationSalary}
          occupationName={occupationName}
          setOccupationName={setOccupationName}
          InfoTooltip={InfoTooltip}
        />
      </CardContent>
        <CardFooter className="flex flex-col w-full p-6">
          <div className="flex flex-col w-full gap-4">
            <LifetimeEarnings 
              schoolYears={schoolYears}
              hasSelectedOccupation={hasSelectedOccupation}
              occupationName={occupationName}
              occupationSalary={occupationSalary}
              formatCurrency={formatCurrency}
              InfoTooltip={InfoTooltip}
            />
            <TotalCost
              hasSelectedOccupation={hasSelectedOccupation}
              medianTotalCost={medianTotalCost}
              medianInterestCost={medianInterestCost}
              medianOpportunityCost={medianOpportunityCost}
              tuition={tuition}
              loan={loan}
              interest={interest}
              schoolYears={schoolYears}
              occupationName={occupationName}
              COLORS={COLORS}
              InfoTooltip={InfoTooltip}
              medianBreakEvenYears={medianBreakEvenYears}
              specificBreakEvenYears={specificBreakEvenYears}
            />
          </div>
        </CardFooter>
      <Disclaimer githubLink={GITHUB_LINK} />
    </Card>
  );
}
