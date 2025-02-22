interface DisclaimerProps {
  githubLink: string;
}

export default function Disclaimer({ githubLink }: DisclaimerProps) {
  return (
    <div className="mt-6 text-xs text-muted-foreground border-t pt-4">
      <p>
        Disclaimer: This tool is designed to help you make a more informed decision when deciding what to do with your future. 
        This program nor its creators are liable for any decisions you make based on the information this tool provides. 
        All numbers are estimates and should not be considered financial advice. Remember that your future is in your hands, 
        don&apos;t be scared to do what you know is best in your heart. People might disagree, but remember it&apos;s your life, not theirs.
      </p>
      <br/>
      <p>
        If you are interested in seeing how everything is calculated, check out the source code{" "}
        <a 
          href={githubLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline" 
          style={{textDecoration: 'underline', color: 'blue'}}
        >
          here
        </a>
      </p>
    </div>
  );
}
