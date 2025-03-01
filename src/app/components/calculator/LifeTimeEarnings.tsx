import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LifetimeEarningsProps {
  salaryWithoutCollege: number;
  salaryWithCollege: number;
  schoolYears: string;
  hasSelectedOccupation: boolean;
  occupationName: string;
  occupationSalary: number;
  formatCurrency: (value: number) => string;
  InfoTooltip: React.FC<{ content: string }>;
}

const LifetimeEarnings = ({
  salaryWithoutCollege,
  salaryWithCollege,
  schoolYears,
  hasSelectedOccupation,
  occupationName,
  occupationSalary,
  formatCurrency,
  InfoTooltip
}: LifetimeEarningsProps) => {
  // Calculate lifetime earnings data
  const calculateLifetimeEarnings = () => {
    const nonCollegeYears = 45;
    const schoolYearsNum = parseInt(schoolYears) || 0;
    const collegeYears = 45 - schoolYearsNum;
    
    const nonCollegeEarnings = nonCollegeYears * salaryWithoutCollege;
    const collegeEarnings = collegeYears * salaryWithCollege;
    
    if (hasSelectedOccupation) {
      // Return three data points when an occupation is selected
      return [
        {
          name: "High School Diploma",
          earnings: nonCollegeEarnings,
          years: nonCollegeYears
        },
        {
          name: "Bachelor's Degree",
          earnings: collegeEarnings,
          years: collegeYears
        },
        {
          name: occupationName,
          earnings: collegeYears * occupationSalary,
          years: collegeYears
        }
      ];
    } else {
      // Return two data points when no occupation is selected
      return [
        {
          name: "High School Diploma",
          earnings: nonCollegeEarnings,
          years: nonCollegeYears
        },
        {
          name: "Bachelor's Degree",
          earnings: collegeEarnings,
          years: collegeYears
        }
      ];
    }
  };
  
  const data = calculateLifetimeEarnings();
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];
  
  return(
    <div className="grid gap-4">
      <h3 className="font-semibold">
        Lifetime Earnings Comparison
        <InfoTooltip content="Comparison of total earnings over a 45-year career period. College paths account for years spent in school." />
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barGap={20}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            scale="band"
            tick={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)}
            width={100}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(value)}
            labelFormatter={(label) => {
              const item = data.find(d => d.name === label);
              return `${label} (${item?.years} years)`;
            }}
            cursor={false}
            wrapperStyle={{ zIndex: 100 }}
          />
          <Bar dataKey="earnings" name="Lifetime Earnings">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LifetimeEarnings;