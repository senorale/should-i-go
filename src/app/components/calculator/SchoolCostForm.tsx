import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import OptionalForm from './OptionalForm';
import * as CollegeConstants from '@/app/constants/college_related_constants';

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

interface SchoolCostFormProps {
  tuition: number,
  loan: number,
  interest: string,
  schoolYears: string,
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
}

export default function SchoolCostForm({
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
  InfoTooltip
}: SchoolCostFormProps) {
  const [showOptionalForm, setShowOptionalForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allOccupations, setAllOccupations] = useState<SearchResult[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const categoriesResponse = await fetch('/api/occupations/categories');
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);
      
      const occupationsResponse = await fetch('/api/occupations/subcategories');
      const occupationsData = await occupationsResponse.json();
      setAllOccupations(occupationsData);
    };
    
    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="salaryWithoutCollege">Highschool Diploma Median Salary</Label>
          <InfoTooltip
            content="Default salary data comes from the U.S. Bureau of Labor Statistics (BLS) 2023 study on earnings by educational attainment."
            footerLink="https://www.bls.gov/careeroutlook/2024/data-on-display/education-pays.htm"
          />
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-gray-500">Annual Salary: {formatCurrency(CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY)}</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="salaryWithCollege">Bachelor&apos;s Degree Median Salary</Label>
          <InfoTooltip
            content="Default salary data comes from the U.S. Bureau of Labor Statistics (BLS) 2023 study on earnings by educational attainment."
            footerLink="https://www.bls.gov/careeroutlook/2024/data-on-display/education-pays.htm"
          />
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-gray-500">Annual Salary: {formatCurrency(CollegeConstants.BACHELOR_DEGREE_MEDIAN_SALARY)}</p>
        </div>
      </div>

      <Button 
        variant="secondary" 
        className="flex items-center justify-between w-full"
        onClick={() => setShowOptionalForm(!showOptionalForm)}
      >
        <span>Fill in Your Details to Compare</span>
        {showOptionalForm ? <Minus size={16} /> : <Plus size={16} />}
      </Button>

      {showOptionalForm && (
        <OptionalForm
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
          categories={categories}
          allOccupations={allOccupations}
          InfoTooltip={InfoTooltip}
        />
      )}
    </div>
  );
}