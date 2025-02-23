import React from 'react';
import { CardContent } from "@/components/ui/card";
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
        <Label htmlFor="no-college">Salary without College</Label>
        <Input
          id="no-college"
          type="text"
          value={formatCurrency(salaryWithoutCollege)}
          onChange={(e) => handleCurrencyInput(e.target.value, setSalaryWithoutCollege)}
        />
      </div>
      
      <OccupationSelects 
        onOccupationSelect={(code) => {
          console.log('Selected occupation code:', code);
        }}
        setSalaryWithCollege={setSalaryWithCollege}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="with-college">Salary with College</Label>
        <Input
          id="with-college"
          type="text"
          value={formatCurrency(salaryWithCollege)}
          onChange={(e) => handleCurrencyInput(e.target.value, setSalaryWithCollege)}
        />
      </div>

      {!showResults && (
        <Button onClick={calculateCosts} className="w-full mt-2">
          Calculate
        </Button>
      )}
    </div>
  );
}