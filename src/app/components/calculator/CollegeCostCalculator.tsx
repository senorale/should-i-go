'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { InfoIcon } from 'lucide-react';

import { calculateTotalInterestPaid, calculateBreakEvenYears } from '../../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import LifetimeEarnings from './LifeTimeEarnings';
import TotalCost from './TotalCost';
import BreakEvenPoint from './BreakEvenPoint';
import Disclaimer from './Disclaimer';
import CollegeCostForm from './CollegeCostForm';

const STUDENT_LOAN_CALCULATION_LINK = "https://studentaid.gov/understand-aid/types/loans/interest-rates"
const GITHUB_LINK = "https://github.com/mikebranc/should-i-go"

const InfoTooltip = ({ content, footerLink }: { content: string; footerLink?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <UITooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <InfoIcon
            className="h-4 w-4 ml-1 inline-block cursor-help"
            onClick={() => setIsOpen(!isOpen)}
          />
        </TooltipTrigger>
        <TooltipContent sideOffset={5} className="max-w-sm">
          <div>{content}</div>
          {footerLink && (
            <div className="mt-2 text-xs">
              <a href={footerLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" style={{textDecoration: 'underline', color: 'blue'}}>
                {footerLink}
              </a>
            </div>
          )}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
};

function useDebounce(callback: () => void, delay: number) {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);
}

export default function CollegeCostCalculator() {
  const [tuition, setTuition] = useState(50000);
  const [loan, setLoan] = useState(40000);
  // interest is a string to allow an empty input
  const [interest, setInterest] = useState<string>('5');
  const [salaryWithoutCollege, setSalaryWithoutCollege] = useState(35000);
  const [salaryWithCollege, setSalaryWithCollege] = useState(55000);
    // schoolYears is a string to allow an empty input
  const [schoolYears, setSchoolYears] = useState<string>('4');

  const [totalCost, setTotalCost] = useState(0);
  const [loanInterest, setLoanInterest] = useState(0);
  const [opportunityCost, setOpportunityCost] = useState(0);
  const [breakEvenYears, setBreakEvenYears] = useState<number | string>(0);
  const [showResults, setShowResults] = useState(false);

  const [debouncedSalaryWithoutCollege, setDebouncedSalaryWithoutCollege] = useState(35000);
  const [debouncedSalaryWithCollege, setDebouncedSalaryWithCollege] = useState(55000);
  const [debouncedSchoolYears, setDebouncedSchoolYears] = useState('4');

  const calculateCosts = () => {
    const schoolYearsNum = parseInt(schoolYears) || 0;
    const interestCost = parseFloat(calculateTotalInterestPaid(loan, parseFloat(interest), 10));
    const opportunityCostValue = salaryWithoutCollege * schoolYearsNum;
    const totalCostValue = tuition + interestCost + opportunityCostValue;
    const breakEven = calculateBreakEvenYears(totalCostValue, salaryWithCollege, salaryWithoutCollege);

    setLoanInterest(interestCost);
    setOpportunityCost(opportunityCostValue);
    setTotalCost(totalCostValue);
    setBreakEvenYears(breakEven);
    setDebouncedSalaryWithoutCollege(salaryWithoutCollege);
    setDebouncedSalaryWithCollege(salaryWithCollege);
    setDebouncedSchoolYears(schoolYears);
    setShowResults(true);
  };

  const debouncedCalculate = useDebounce(calculateCosts, 500);

  useEffect(() => {
    if (showResults) {
      debouncedCalculate();
    }
  }, [tuition, loan, interest, salaryWithoutCollege, salaryWithCollege, schoolYears]);

  const data = [
    { name: "Tuition", value: tuition },
    { name: "Loan Interest", value: loanInterest },
    { name: "Opportunity Cost", value: opportunityCost },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyWithCents = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrencyWithSign = (value: number) => {
    const formattedValue = formatCurrency(Math.abs(value));
    if (value > 0) {
      return `+$${formattedValue.slice(1)}`;
    }
    return `-$${formattedValue.slice(1)}`;
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
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setSchoolYears(value);
    }
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

  const calculateLifetimeEarnings = () => {
    const nonCollegeYears = 45;
    const schoolYearsNum = parseInt(debouncedSchoolYears) || 0;
    const collegeYears = 45 - schoolYearsNum;
    
    const nonCollegeEarnings = nonCollegeYears * debouncedSalaryWithoutCollege;
    const collegeEarnings = collegeYears * debouncedSalaryWithCollege;

    return [
      {
        name: "Without College",
        earnings: nonCollegeEarnings,
        years: nonCollegeYears
      },
      {
        name: "With College",
        earnings: collegeEarnings,
        years: collegeYears
      }
    ];
  };

  const calculateEarningsDifference = () => {
    const lifetimeEarnings = calculateLifetimeEarnings();
    return lifetimeEarnings[1].earnings - lifetimeEarnings[0].earnings;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle>College Cost Calculator</CardTitle>
        <CardDescription>Calculate the true cost of college</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CollegeCostForm
          tuition={tuition}
          loan={loan}
          interest={interest}
          salaryWithoutCollege={salaryWithoutCollege}
          salaryWithCollege={salaryWithCollege}
          schoolYears={schoolYears}
          showResults={showResults}
          formatCurrency={formatCurrency}
          handleCurrencyInput={handleCurrencyInput}
          handleInterestInput={handleInterestInput}
          handleSchoolYearsChange={handleSchoolYearsChange}
          setTuition={setTuition}
          setLoan={setLoan}
          setInterest={setInterest}
          setSalaryWithoutCollege={setSalaryWithoutCollege}
          setSalaryWithCollege={setSalaryWithCollege}
          setSchoolYears={setSchoolYears}
          calculateCosts={calculateCosts}
        />
      </CardContent>
      {showResults && (
        <CardFooter className="flex flex-col w-full p-6">
          <div className="flex flex-col w-full gap-4">
            <LifetimeEarnings 
              formatCurrencyWithSign={formatCurrencyWithSign}
              calculateEarningsDifference={calculateEarningsDifference}
              calculateLifetimeEarnings={calculateLifetimeEarnings}
              formatCurrency={formatCurrency}
              schoolYears={schoolYears}
              InfoTooltip={InfoTooltip}
            />
            <TotalCost 
              formatCurrencyWithCents={formatCurrencyWithCents}
              totalCost={totalCost}
              tuition={tuition}
              loanInterest={loanInterest}
              opportunityCost={opportunityCost}
              schoolYears={schoolYears}
              data={data}
              CustomTooltip={CustomTooltip}
              COLORS={COLORS}
              InfoTooltip={InfoTooltip}
              STUDENT_LOAN_CALCULATION_LINK={STUDENT_LOAN_CALCULATION_LINK}
            />
            <BreakEvenPoint 
              breakEvenYears={breakEvenYears}
              InfoTooltip={InfoTooltip}
            />
          </div>
        </CardFooter>
      )}
      <Disclaimer githubLink={GITHUB_LINK} />
    </Card>
  );
}
