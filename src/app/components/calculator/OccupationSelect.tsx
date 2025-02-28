import React, { useState, useEffect } from 'react';
import { OCCUPATIONS } from '@/app/constants/occupations';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface Occupation {
  id: string;
  name: string;
  annual_salary: number;
}

interface OccupationSelectsProps {
  setSalaryWithCollege: React.Dispatch<React.SetStateAction<number>>;
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

const OES_BASE = 'OEUN0000000000000';
const DATA_TYPE = '13';

const occupationTooltipText = "Salary data comes from the U.S. Bureau of Labor Statistics (BLS). Note: The highest reported annual salary is capped at $239,200.";

export default function OccupationSelects({ setSalaryWithCollege, InfoTooltip }: OccupationSelectsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/occupations/categories');
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedOccupation('');
    
    const response = await fetch(`/api/occupations/subcategories?categoryId=${categoryId}`);
    const data = await response.json();
    setOccupations(data);
  };

  const handleOccupationChange = (occupationId: string) => {
    setSelectedOccupation(occupationId);
    const occupation = occupations.find(occ => occ.id === occupationId);
    if (occupation) {
      setSalaryWithCollege(occupation.annual_salary);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label>Occupation</Label>
        <InfoTooltip 
          content={occupationTooltipText}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="category">Occupation Category</Label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category" className={selectedCategory ? "w-[300px]" : ""}>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select a category" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="truncate">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="occupation">Specific Occupation</Label>
          <Select 
            value={selectedOccupation} 
            onValueChange={handleOccupationChange}
            disabled={!selectedCategory}
          >
            <SelectTrigger id="occupation" className={selectedOccupation ? "w-[300px]" : ""}>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select an occupation" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {occupations.map((occupation) => (
                <SelectItem key={occupation.id} value={occupation.id} className="truncate">
                  {occupation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}