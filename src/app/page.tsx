import Image from "next/image";

import CollegeCostCalculator from "./components/calculator/CollegeCostCalculator";
const TWITTER_LINK = "https://x.com/mike_branc"
const ALE_LINKED_IN = "https://www.linkedin.com/in/alejandro-carvajal-916b55190/"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-16 pb-12">
      <CollegeCostCalculator />
      <p className="mt-4">Created by <a href={TWITTER_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" style={{textDecoration: 'underline', color: 'blue'}}>Michael Branconier</a> & <a href={ALE_LINKED_IN} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" style={{textDecoration: 'underline', color: 'blue'}}>Alejandro Carvajal</a></p>
    </main>
  );
}
