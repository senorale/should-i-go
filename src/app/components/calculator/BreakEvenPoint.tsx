interface BreakEvenPointProps {
  breakEvenYears: number | string;
  InfoTooltip: React.ComponentType<{ content: string; footerLink?: string }>;
}

export default function BreakEvenPoint({ breakEvenYears, InfoTooltip }: BreakEvenPointProps) {
  return (
    <div className="grid gap-2">
      <h2 className="text-3xl font-semibold">
        Break-Even Point {typeof breakEvenYears === 'number' ? `${breakEvenYears.toFixed(1)} years` : 'N/A'}
        <InfoTooltip content="The number of years it will take for your additional earnings from a college degree to offset the total cost of college." />
      </h2>
      <p>
        {typeof breakEvenYears === 'number'
          ? `You will break even on your college investment in approximately ${breakEvenYears.toFixed(1)} years.`
          : 'Unable to calculate break-even point.'}
      </p>
    </div>
  );
}
