'use client';

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
  footerLinkText?: string;
}

export const InfoTooltip = ({ content, footerLink, footerLinkText }: InfoTooltipProps) => {
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
                className="text-primary underline"
              >
                {footerLinkText || footerLink}
              </a>
            </div>
          )}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
};