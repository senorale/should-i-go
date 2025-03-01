import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer"
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Occupation {
  id: string;
  name: string;
  annual_salary: number;
}

interface SearchResult {
  id: string
  name: string
  annual_salary: number
  category: {
    name: string
  }
}

interface OccupationSelectsProps {
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
  hasSelectedOccupation: boolean;
  setHasSelectedOccupation: React.Dispatch<React.SetStateAction<boolean>>;
  setOccupationSalary: React.Dispatch<React.SetStateAction<number>>;
  setOccupationName: React.Dispatch<React.SetStateAction<string>>;
}

const occupationTooltipText = "Salary data comes from the U.S. Bureau of Labor Statistics (BLS). Note: The highest reported annual salary is capped at $239,200.";

export default function OccupationSelects({ 
  InfoTooltip,
  hasSelectedOccupation,
  setHasSelectedOccupation,
  setOccupationSalary,
  setOccupationName
}: OccupationSelectsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchMode, setIsSearchMode] = useState(true)

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
    setHasSelectedOccupation(false);
    
    const response = await fetch(`/api/occupations/subcategories?categoryId=${categoryId}`);
    const data = await response.json();
    setOccupations(data);
  };

  const handleOccupationChange = (occupationId: string) => {
    setSelectedOccupation(occupationId);
    const occupation = occupations.find(occ => occ.id === occupationId);
    if (occupation) {
      setOccupationSalary(occupation.annual_salary);
      setOccupationName(occupation.name);
      setHasSelectedOccupation(true);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length >= 3) {
      const response = await fetch(`/api/occupations/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data)
    } else {
      setSearchResults([])
    }
  }

  const handleSearchResultSelect = (result: SearchResult) => {
    setOccupationSalary(result.annual_salary);
    setOccupationName(result.name);
    setHasSelectedOccupation(true);
    
    setSearchQuery(result.name);
    setSearchResults([]);
  }

  const clearOccupationSelection = () => {
    setHasSelectedOccupation(false);
    setSelectedCategory('');
    setSelectedOccupation('');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Occupation</Label>
          <InfoTooltip content={occupationTooltipText} 
          footerLink='https://www.bls.gov/oes/tables.htm' 
          />
        </div>
        <Button
          onClick={() => {
            setIsSearchMode(!isSearchMode)
            if (isSearchMode) {
              setSearchQuery('')
              setSearchResults([])
            }
          }}
          size="sm"
        >
          {isSearchMode ? "Browse All Categories" : "Search Occupations"}
        </Button>
      </div>

      {isSearchMode ? (
        <div className="flex-1 mb-4 relative">
          <div className="flex items-center mb-1">
            <Label htmlFor="search">Search Occupation</Label>
            {isSearchMode && hasSelectedOccupation && (
              <Button
                onClick={clearOccupationSelection}
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                aria-label="Clear occupation selection"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Enter at least 3 characters..."
            className="w-full"
          />
          {searchResults.length > 0 && (
            <Drawer onClose={() => setSearchResults([])}>
              <div className="max-h-[50vh] overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchResultSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground border-b last:border-0"
                  >
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-500">{result.category.name}</div>
                  </button>
                ))}
              </div>
            </Drawer>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <Label htmlFor="category">Occupation Category</Label>
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category" className={selectedCategory ? "w-[300px]" : ""}>
                <div className="flex-1 text-left truncate">
                  <SelectValue placeholder="Select a category" />
                </div>
              </SelectTrigger>
              <SelectContent position="item-aligned" side="bottom">
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
                <div className="flex-1 text-left truncate">
                  <SelectValue placeholder="Select an occupation" />
                </div>
              </SelectTrigger>
              <SelectContent position="item-aligned" side="bottom">
                {occupations.map((occupation) => (
                  <SelectItem key={occupation.id} value={occupation.id} className="truncate">
                    {occupation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}