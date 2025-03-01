import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OccupationSelects from './OccupationSelect';

interface CollegeCostFormProps {
  tuition: number;
  loan: number;
  interest: string;
  salaryWithoutCollege: number;
  salaryWithCollege: number;
  schoolYears: string;
  showResults: boolean;
  formatCurrency: (value: number) => string;
  handleCurrencyInput: (value: string, setter: React.Dispatch<React.SetStateAction<number>>) => void;
  handleInterestInput: (value: string) => void;
  handleSchoolYearsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setTuition: React.Dispatch<React.SetStateAction<number>>;
  setLoan: React.Dispatch<React.SetStateAction<number>>;
  setInterest: React.Dispatch<React.SetStateAction<string>>;
  setSalaryWithoutCollege: React.Dispatch<React.SetStateAction<number>>;
  setSalaryWithCollege: React.Dispatch<React.SetStateAction<number>>;
  setSchoolYears: React.Dispatch<React.SetStateAction<string>>;
  calculateCosts: () => void;
  hasSelectedOccupation: boolean;
  setHasSelectedOccupation: React.Dispatch<React.SetStateAction<boolean>>;
  occupationSalary: number;
  setOccupationSalary: React.Dispatch<React.SetStateAction<number>>;
  occupationName: string;
  setOccupationName: React.Dispatch<React.SetStateAction<string>>;
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;

}

export default function CollegeCostForm({
  tuition,
  loan,
  interest,
  salaryWithoutCollege,
  salaryWithCollege,
  schoolYears,
  showResults,
  formatCurrency,
  handleCurrencyInput,
  handleInterestInput,
  handleSchoolYearsChange,
  setTuition,
  setLoan,
  setInterest,
  setSalaryWithoutCollege,
  setSalaryWithCollege,
  setSchoolYears,
  calculateCosts,
  hasSelectedOccupation,
  setHasSelectedOccupation,
  occupationSalary,
  setOccupationSalary,
  occupationName,
  setOccupationName,
  InfoTooltip
}: CollegeCostFormProps) {
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="tuition">Tuition Cost</Label>
        <Input
          id="tuition"
          type="text"
          value={formatCurrency(tuition)}
          onChange={(e) => handleCurrencyInput(e.target.value, setTuition)}
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <Label htmlFor="loan">Loan Amount</Label>
        <Input
          id="loan"
          type="text"
          value={formatCurrency(loan)}
          onChange={(e) => handleCurrencyInput(e.target.value, setLoan)}
        />
      </div>

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="school-years">Years in School</Label>
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
          <Label htmlFor="salaryWithoutCollege">Highschool Diploma Median Salary</Label>
          <InfoTooltip
            content="Default salary data comes from the U.S. Bureau of Labor Statistics (BLS) 2023 study on earnings by educational attainment."
            footerLink="https://www.bls.gov/careeroutlook/2024/data-on-display/education-pays.htm"
          />
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-gray-500">Annual Salary: {formatCurrency(salaryWithoutCollege)}</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="salaryWithCollege">Bachelor's Degree Median Salary</Label>
          <InfoTooltip
            content="Default salary data comes from the U.S. Bureau of Labor Statistics (BLS) 2023 study on earnings by educational attainment."
            footerLink="https://www.bls.gov/careeroutlook/2024/data-on-display/education-pays.htm"
          />
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-gray-500">Annual Salary: {formatCurrency(salaryWithCollege)}</p>
        </div>
      </div>
      
      <OccupationSelects
        InfoTooltip={InfoTooltip}
        hasSelectedOccupation={hasSelectedOccupation}
        setHasSelectedOccupation={setHasSelectedOccupation}
        setOccupationSalary={setOccupationSalary}
        setOccupationName={setOccupationName}
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
        </div>
      )}

      {!showResults && (
        <Button onClick={calculateCosts} className="w-full mt-2">
          Calculate
        </Button>
      )}
    </div>
  );
}