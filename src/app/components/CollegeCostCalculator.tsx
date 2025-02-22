'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { InfoIcon } from 'lucide-react';

import { calculateTotalInterestPaid, calculateBreakEvenYears } from '../utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [interest, setInterest] = useState<string>('5');
  const [salaryWithoutCollege, setSalaryWithoutCollege] = useState(35000);
  const [salaryWithCollege, setSalaryWithCollege] = useState(55000);
  const [schoolYears, setSchoolYears] = useState<string>('4');

  const [totalCost, setTotalCost] = useState(0);
  const [loanInterest, setLoanInterest] = useState(0);
  const [opportunityCost, setOpportunityCost] = useState(0);
  const [breakEvenYears, setBreakEvenYears] = useState<number | string>(0);
  const [showResults, setShowResults] = useState(false);

  const calculateCosts = () => {
    const interestCost = parseFloat(calculateTotalInterestPaid(loan, parseFloat(interest), 10));
    const opportunityCostValue = salaryWithoutCollege * (parseInt(schoolYears) || 0);
    const totalCostValue = tuition + interestCost + opportunityCostValue;
    const breakEven = calculateBreakEvenYears(totalCostValue, salaryWithCollege, salaryWithoutCollege);

    setLoanInterest(interestCost);
    setOpportunityCost(opportunityCostValue);
    setTotalCost(totalCostValue);
    setBreakEvenYears(breakEven);
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
    const collegeYears = 45 - parseInt(schoolYears);
    
    const nonCollegeEarnings = nonCollegeYears * salaryWithoutCollege;
    const collegeEarnings = collegeYears * salaryWithCollege;

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

  return (
    <Card className="max-w-2xl w-full mx-auto p-6">
      <CardHeader>
        <CardTitle>College Cost Calculator</CardTitle>
        <CardDescription>Calculate the true cost of college</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tuition">Tuition Cost</Label>
          <Input
            id="tuition"
            type="text"
            value={formatCurrency(tuition)}
            onChange={(e) => handleCurrencyInput(e.target.value, setTuition)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="loan">Loan Amount</Label>
          <Input
            id="loan"
            type="text"
            value={formatCurrency(loan)}
            onChange={(e) => handleCurrencyInput(e.target.value, setLoan)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="interest">Interest Rate (%)</Label>
          <Input
            id="interest"
            type="text"
            value={interest}
            onChange={(e) => handleInterestInput(e.target.value)}
            onBlur={() => {
              const numericValue = parseFloat(interest);
              if (!isNaN(numericValue)) {
                setInterest(numericValue.toFixed(2));
              } else if (interest === '') {
                setInterest('0');
              }
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="school-years">Years in School</Label>
          <Input
            id="school-years"
            type="text"
            value={schoolYears}
            onChange={handleSchoolYearsChange}
            onBlur={() => {
              if (schoolYears === '') {
                setSchoolYears('4'); // Default to 4 if left blank
              }
            }}
          />
      </div>
        <div className="grid gap-2">
          <Label htmlFor="no-college">Salary without College</Label>
          <Input
            id="no-college"
            type="text"
            value={formatCurrency(salaryWithoutCollege)}
            onChange={(e) => handleCurrencyInput(e.target.value, setSalaryWithoutCollege)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="with-college">Salary with College</Label>
          <Input
            id="with-college"
            type="text"
            value={formatCurrency(salaryWithCollege)}
            onChange={(e) => handleCurrencyInput(e.target.value, setSalaryWithCollege)}
          />
        </div>
        {!showResults && (
          <Button onClick={calculateCosts}>Calculate</Button>
        )}
      </CardContent>
      {showResults && (
        <CardFooter>
          <div className="grid gap-4 w-full">
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
            <div className="grid gap-2">
              <h2 className="text-3xl font-semibold">
                Break-Even Point {typeof breakEvenYears === 'number' ? `${breakEvenYears.toFixed(1)} years` : 'N/A'}
                <InfoTooltip content="The number of years it will take for your additional earnings from a college degree to offset the total cost of college." />
              </h2>
              <p>
                {typeof breakEvenYears === 'number'
                  ? `You will break even on your college investment in approximately ${breakEvenYears.toFixed(1)} years.`
                  : 'Unable to calculate break-even point.'}
              </p>
            </div>
            <div className="grid gap-4">
              <h3 className="font-semibold">Lifetime Earnings Comparison +({formatCurrency(calculateLifetimeEarnings()[1].earnings - calculateLifetimeEarnings()[0].earnings)})
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
          </div>
        </CardFooter>
      )}
      <div className="mt-6 text-xs text-muted-foreground border-t pt-4">
        <p>Disclaimer: This tool is designed to help you make a more informed decision when deciding what to do with your future. This program nor its creators are liable for any decisions you make based on the information this tool provides. All numbers are estimates and should not be considered financial advice. Remember that your future is in your hands, don&apos;t be scared to do what you know is best in your heart. People might disagree, but remember it&apos;s your life, not theirs.</p>
        <br/>
        <p>If you are interested in seeing how everything is calculated, check out the source code <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" style={{textDecoration: 'underline', color: 'blue'}}>here</a></p>
      </div>
    </Card>
  );
}
