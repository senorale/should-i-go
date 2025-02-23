import React, { useState } from 'react';
import { OCCUPATIONS } from '@/app/constants/occupations';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OccupationSelectsProps {
  onOccupationSelect: (code: string) => void;
  setSalaryWithCollege: React.Dispatch<React.SetStateAction<number>>;
}

const OES_BASE = 'OEUN0000000000000';
const DATA_TYPE = '13';

const occupationTooltipText = "Salary data comes from the U.S. Bureau of Labor Statistics (BLS). Note: The highest reported annual salary is capped at $239,200.";

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

export default function OccupationSelects({ onOccupationSelect, setSalaryWithCollege }: OccupationSelectsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');

  const categories = Object.keys(OCCUPATIONS);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedOccupation(''); 
  };

  const fetchSalaryData = async (occupationCode: string) => {
    try {
      const response = await fetch('/api/bls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seriesid: [`${OES_BASE}${occupationCode}${DATA_TYPE}`],
          startyear: "2023",
          endyear: "2023",
        })
      });

      const data = await response.json();
      if (data.status === "REQUEST_SUCCEEDED" && data.Results?.series?.[0]?.data?.[0]) {
        const valueData = data.Results.series[0].data[0];
        let salary: number;
        
        if (valueData.value === "-" && valueData.footnotes?.[0]?.text?.includes("239,200")) {
          salary = 239200; // Use the minimum value when salary exceeds this amount
        } else {
          salary = parseFloat(valueData.value);
        }
        
        if (!isNaN(salary)) {
          setSalaryWithCollege(salary);
        }
      }
    } catch (error) {
      console.error('Error fetching BLS data:', error);
    }
  };

  const handleOccupationChange = (value: string) => {
    setSelectedOccupation(value);
    const category = OCCUPATIONS[selectedCategory as keyof typeof OCCUPATIONS];
    const occupationCode = category[value as keyof typeof category];
    onOccupationSelect(occupationCode);
    fetchSalaryData(occupationCode);
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
            <SelectTrigger id="category">
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select a category" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="text-left">
                  {category}
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
            <SelectTrigger id="occupation">
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select an occupation" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {selectedCategory && Object.keys(OCCUPATIONS[selectedCategory as keyof typeof OCCUPATIONS]).map((occupation) => (
                <SelectItem key={occupation} value={occupation} className="text-left">
                  {occupation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}