import { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: string;
  footerLink?: string;
}

export const InfoTooltip = ({ content, footerLink }: InfoTooltipProps) => {
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
              <a 
                href={footerLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline" 
                style={{textDecoration: 'underline', color: 'blue'}}
              >
                {footerLink}
              </a>
            </div>
          )}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
};