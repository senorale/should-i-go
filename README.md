# College Cost Calculator

This project provides a comprehensive college cost calculator. It helps users estimate the true cost of attending college by considering tuition, loans, interest rates, and opportunity costs. The big difference between this and other calculators
is that we factor in opportunity cost and look at how long it would take for your education to be profitable. 

## Features

- Calculate total college costs including tuition, loan interest, and opportunity cost
- Visualize cost breakdown with an interactive pie chart
- Estimate break-even point based on expected salary differences


## Getting Started

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/mikebranc/should-i-go.git
   cd should-i-go
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

The main components of this project are:

- `src/app/components/CollegeCostCalculator.tsx`: The main component for the calculator UI and logic
- `src/app/components/InfoTooltip.tsx`: A reusable tooltip component for providing additional information
- `src/app/utils.ts`: Utility functions for calculations

## Calculations and assumptions

### Opportunity cost calculation
Opportunity cost is calculated by multiplying your annual high school salary by the number of years spent in college.

### Breakeven calculation
The breakeven point is calculated by finding the intersection of two lines: one representing the cumulative earnings without a college degree, and another representing the cumulative earnings with a college degree minus the total cost of education. This can be modeled by the following equation:

t * H = t * C - (T + I + O)

Where:
t = time (in years)
H = annual salary with high school diploma
C = annual salary with college degree
T = total tuition cost
I = total interest cost on student loans
O = opportunity cost (Y * H), where Y is the number of years spent in college

Solving for t gives us the breakeven point in years:

t = (T + I + O) / (C - H)

This equation calculates how long it takes for the additional earnings from a college degree to offset the total cost of obtaining that degree.

### Interest Calculation

The loan interest is calculated using the daily simple interest formula, which is commonly used for student loans. This method accrues interest daily based on the outstanding principal balance. We assume a 10 year loan which is pretty standard.

For more detailed information on how student loan interest is calculated, please refer to these helpful links and calculators:
- [Understanding Interest Rates for Federal Student Loans](https://studentaid.gov/understand-aid/types/loans/interest-rates)
- [Bankrate - How to Calculate Sudent Loan Interest](https://www.bankrate.com/loans/student-loans/how-to-calculate-student-loan-interest/)
- [Bankrate - Student Loan Calculator](https://www.bankrate.com/loans/student-loans/student-loan-calculator/)
- [Forbes - Student Loan Calculator](https://www.forbes.com/advisor/student-loans/student-loan-calculator/)

## Disclaimer

This tool is designed to help make more informed decisions about college costs. It provides estimates and should not be considered financial advice. Users should consult with financial professionals for personalized advice.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Recharts Library](https://recharts.org/en-US/)
