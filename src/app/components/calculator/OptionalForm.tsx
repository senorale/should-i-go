import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import OccupationSelects from './OccupationSelect';

interface Category {
  id: string;
  name: string;
}

interface SearchResult {
  id: string;
  name: string;
  annual_salary: number;
  category: {
    name: string;
    id: string;
  }
}

interface OptionalFormProps {
  tuition: number;
  loan: number;
  interest: string;
  schoolYears: string;
  formatCurrency: (value: number) => string;
  handleCurrencyInput: (value: string, setter: React.Dispatch<React.SetStateAction<number>>) => void;
  handleInterestInput: (value: string) => void;
  handleSchoolYearsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setTuition: React.Dispatch<React.SetStateAction<number>>;
  setLoan: React.Dispatch<React.SetStateAction<number>>;
  setInterest: React.Dispatch<React.SetStateAction<string>>;
  setSchoolYears: React.Dispatch<React.SetStateAction<string>>;
  hasSelectedOccupation: boolean;
  setHasSelectedOccupation: React.Dispatch<React.SetStateAction<boolean>>;
  occupationSalary: number;
  setOccupationSalary: React.Dispatch<React.SetStateAction<number>>;
  occupationName: string;
  setOccupationName: React.Dispatch<React.SetStateAction<string>>;
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
  categories: Category[];
  allOccupations: SearchResult[];
}

export default function OptionalForm({
  tuition,
  loan,
  interest,
  schoolYears,
  formatCurrency,
  handleCurrencyInput,
  handleInterestInput,
  handleSchoolYearsChange,
  setTuition,
  setLoan,
  setInterest,
  setSchoolYears,
  hasSelectedOccupation,
  setHasSelectedOccupation,
  occupationSalary,
  setOccupationSalary,
  occupationName,
  setOccupationName,
  InfoTooltip,
  categories,
  allOccupations,
}: OptionalFormProps) {
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-2">
        <OccupationSelects
          InfoTooltip={InfoTooltip}
          hasSelectedOccupation={hasSelectedOccupation}
          setHasSelectedOccupation={setHasSelectedOccupation}
          setOccupationSalary={setOccupationSalary}
          setOccupationName={setOccupationName}
          categories={categories}
          allOccupations={allOccupations}
        />
        
        {hasSelectedOccupation && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label>Selected Occupation</Label>
              <InfoTooltip 
                content="Salary data comes from the U.S. Bureau of Labor Statistics (BLS)." 
                footerLink='https://www.bls.gov/oes/tables.htm'
              />
            </div>
            <div className="p-3 border rounded-md">
              <p className="font-medium">{occupationName}</p>
              <p className="text-sm text-gray-500">Annual Salary: {formatCurrency(occupationSalary)}</p>
            </div>
            <p className="text-sm text-gray-500 italic mt-1">
              Note: A higher salary is often the result of an advanced degrees and higher loan amounts. 
              <br />
              For best results, fill in the tuition cost, years in school, & interest rates.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label 
          htmlFor="tuition">
            Total Tuition Cost
          </Label>
          <InfoTooltip 
            content="This is the total cost of tuition for your entire education, not per year."
          />
        </div>
        <Input
          id="tuition"
          type="text"
          value={formatCurrency(tuition)}
          onChange={(e) => handleCurrencyInput(e.target.value, setTuition)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="loan">Total Loan Amount</Label>
          <InfoTooltip 
            content="The total amount you expect to borrow for your education."
          />
        </div>
        <Input
          id="loan"
          type="text"
          value={formatCurrency(loan)}
          onChange={(e) => handleCurrencyInput(e.target.value, setLoan)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="school-years">Years in School</Label>
          <InfoTooltip 
            content="For accurate estimates of education requirements for different occupations, visit the Bureau of Labor Statistics Occupational Outlook Handbook."
            footerLink="https://www.bls.gov/ooh/"
          />
        </div>
        <Input
          id="school-years"
          type="text"
          value={schoolYears}
          onChange={handleSchoolYearsChange}
          onBlur={() => {
            if (schoolYears === '') {
              setSchoolYears('4');
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="interest">Interest Rate (%)</Label>
          <InfoTooltip 
            content="The annual interest rate on your student loans."
          />
        </div>
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
    </div>
  );
} 