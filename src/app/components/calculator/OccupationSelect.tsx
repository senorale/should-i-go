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
  setSalaryWithCollege: React.Dispatch<React.SetStateAction<number>>;
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

const occupationTooltipText = "Salary data comes from the U.S. Bureau of Labor Statistics (BLS). Note: The highest reported annual salary is capped at $239,200.";

export default function OccupationSelects({ setSalaryWithCollege, InfoTooltip }: OccupationSelectsProps) {
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
    setSalaryWithCollege(result.annual_salary)
    setSearchQuery(result.name)
    setSearchResults([]) // Clear results after selection
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Occupation</Label>
          <InfoTooltip content={occupationTooltipText} />
        </div>
        <Button
          onClick={() => {
            setIsSearchMode(!isSearchMode)
            if (isSearchMode) {
              setSearchQuery('')
              setSearchResults([])
            }
          }}
          className="w-auto mt-2"
        >
          {isSearchMode ? "Browse All Categories" : "Search Occupations"}
        </Button>
      </div>

      {isSearchMode ? (
        <div className="flex-1 mb-4 relative">
          <Label htmlFor="search">Search Occupation</Label>
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
            <Label htmlFor="category">Occupation Category</Label>
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