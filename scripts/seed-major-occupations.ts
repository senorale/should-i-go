import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Maps common college majors to BLS occupation codes with relevance scores.
// Relevance: 1.0 = direct pipeline, 0.7 = common path, 0.4 = possible path.
const MAJOR_OCCUPATION_MAP: Record<string, { code: string; relevance: number }[]> = {
  "Computer Science": [
    { code: "15-1252", relevance: 1.0 },  // Software Developers
    { code: "15-1251", relevance: 0.9 },  // Computer Programmers
    { code: "15-1211", relevance: 0.9 },  // Computer Systems Analysts
    { code: "15-1212", relevance: 0.9 },  // Information Security Analysts
    { code: "15-1221", relevance: 0.8 },  // Computer and Information Research Scientists
    { code: "15-2051", relevance: 0.8 },  // Data Scientists
    { code: "15-1231", relevance: 0.7 },  // Computer Network Architects
    { code: "15-1244", relevance: 0.7 },  // Network and Computer Systems Administrators
    { code: "15-1241", relevance: 0.7 },  // Computer Network Support Specialists
    { code: "15-1299", relevance: 0.6 },  // Computer Occupations, All Other
    { code: "11-3021", relevance: 0.6 },  // Computer and Information Systems Managers
    { code: "15-1243", relevance: 0.7 },  // Database Administrators
    { code: "15-1253", relevance: 0.9 },  // Software Quality Assurance Analysts and Testers
    { code: "17-2061", relevance: 0.5 },  // Computer Hardware Engineers
  ],
  "Information Technology": [
    { code: "15-1244", relevance: 1.0 },  // Network and Computer Systems Administrators
    { code: "15-1212", relevance: 0.9 },  // Information Security Analysts
    { code: "15-1231", relevance: 0.8 },  // Computer Network Architects
    { code: "15-1241", relevance: 0.8 },  // Computer Network Support Specialists
    { code: "15-1232", relevance: 0.8 },  // Computer User Support Specialists
    { code: "15-1211", relevance: 0.7 },  // Computer Systems Analysts
    { code: "15-1243", relevance: 0.8 },  // Database Administrators
    { code: "11-3021", relevance: 0.7 },  // Computer and Information Systems Managers
    { code: "15-1252", relevance: 0.6 },  // Software Developers
  ],
  "Data Science": [
    { code: "15-2051", relevance: 1.0 },  // Data Scientists
    { code: "15-2041", relevance: 0.9 },  // Statisticians
    { code: "15-2031", relevance: 0.8 },  // Operations Research Analysts
    { code: "15-1211", relevance: 0.7 },  // Computer Systems Analysts
    { code: "15-1221", relevance: 0.7 },  // Computer and Information Research Scientists
    { code: "15-1243", relevance: 0.7 },  // Database Administrators
    { code: "13-2099", relevance: 0.5 },  // Financial Specialists, All Other
  ],
  "Electrical Engineering": [
    { code: "17-2071", relevance: 1.0 },  // Electrical Engineers
    { code: "17-2072", relevance: 0.9 },  // Electronics Engineers, Except Computer
    { code: "17-3023", relevance: 0.7 },  // Electrical and Electronic Engineering Technologists
    { code: "17-2061", relevance: 0.6 },  // Computer Hardware Engineers
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
  ],
  "Mechanical Engineering": [
    { code: "17-2141", relevance: 1.0 },  // Mechanical Engineers
    { code: "17-3027", relevance: 0.7 },  // Mechanical Engineering Technologists
    { code: "17-2112", relevance: 0.6 },  // Industrial Engineers
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
    { code: "17-2199", relevance: 0.5 },  // Engineers, All Other
  ],
  "Civil Engineering": [
    { code: "17-2051", relevance: 1.0 },  // Civil Engineers
    { code: "17-3022", relevance: 0.7 },  // Civil Engineering Technologists
    { code: "17-2081", relevance: 0.6 },  // Environmental Engineers
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
    { code: "47-4011", relevance: 0.4 },  // Construction and Building Inspectors
  ],
  "Chemical Engineering": [
    { code: "17-2041", relevance: 1.0 },  // Chemical Engineers
    { code: "19-2031", relevance: 0.6 },  // Chemists
    { code: "17-2199", relevance: 0.5 },  // Engineers, All Other
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
  ],
  "Biomedical Engineering": [
    { code: "17-2031", relevance: 1.0 },  // Bioengineers and Biomedical Engineers
    { code: "17-2199", relevance: 0.5 },  // Engineers, All Other
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
  ],
  "Aerospace Engineering": [
    { code: "17-2011", relevance: 1.0 },  // Aerospace Engineers
    { code: "17-3021", relevance: 0.7 },  // Aerospace Engineering Technologists
    { code: "17-2199", relevance: 0.5 },  // Engineers, All Other
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
  ],
  "Biology": [
    { code: "19-1029", relevance: 0.8 },  // Biological Scientists, All Other
    { code: "19-1042", relevance: 0.7 },  // Medical Scientists
    { code: "19-4021", relevance: 0.7 },  // Biological Technicians
    { code: "19-1013", relevance: 0.6 },  // Soil and Plant Scientists
    { code: "19-1023", relevance: 0.6 },  // Zoologists and Wildlife Biologists
    { code: "19-1022", relevance: 0.6 },  // Microbiologists
    { code: "19-1021", relevance: 0.6 },  // Biochemists and Biophysicists
    { code: "29-2010", relevance: 0.5 },  // Clinical Laboratory Technologists and Technicians
    { code: "25-1042", relevance: 0.5 },  // Biological Science Teachers, Postsecondary
  ],
  "Chemistry": [
    { code: "19-2031", relevance: 1.0 },  // Chemists
    { code: "19-4031", relevance: 0.8 },  // Chemical Technicians
    { code: "19-2032", relevance: 0.7 },  // Materials Scientists
    { code: "17-2041", relevance: 0.5 },  // Chemical Engineers
    { code: "25-1052", relevance: 0.5 },  // Chemistry Teachers, Postsecondary
    { code: "19-2099", relevance: 0.6 },  // Physical Scientists, All Other
  ],
  "Physics": [
    { code: "19-2012", relevance: 1.0 },  // Physicists
    { code: "19-2099", relevance: 0.7 },  // Physical Scientists, All Other
    { code: "25-1054", relevance: 0.6 },  // Physics Teachers, Postsecondary
    { code: "17-2199", relevance: 0.5 },  // Engineers, All Other
  ],
  "Mathematics": [
    { code: "15-2021", relevance: 1.0 },  // Mathematicians
    { code: "15-2041", relevance: 0.9 },  // Statisticians
    { code: "15-2011", relevance: 0.9 },  // Actuaries
    { code: "15-2031", relevance: 0.7 },  // Operations Research Analysts
    { code: "15-2051", relevance: 0.6 },  // Data Scientists
    { code: "25-1022", relevance: 0.5 },  // Mathematical Science Teachers, Postsecondary
  ],
  "Nursing": [
    { code: "29-1141", relevance: 1.0 },  // Registered Nurses
    { code: "29-1171", relevance: 0.9 },  // Nurse Practitioners
    { code: "29-1151", relevance: 0.7 },  // Nurse Anesthetists
    { code: "29-1161", relevance: 0.7 },  // Nurse Midwives
    { code: "11-9111", relevance: 0.5 },  // Medical and Health Services Managers
  ],
  "Pre-Med / Biology (Medical School)": [
    { code: "29-1229", relevance: 1.0 },  // Physicians, All Other
    { code: "29-1249", relevance: 0.9 },  // Surgeons, All Other
    { code: "29-1211", relevance: 0.9 },  // Anesthesiologists
    { code: "29-1215", relevance: 0.8 },  // Family Medicine Physicians
    { code: "29-1218", relevance: 0.8 },  // Obstetricians and Gynecologists
    { code: "29-1223", relevance: 0.8 },  // Psychiatrists
    { code: "29-1224", relevance: 0.7 },  // Radiologists
    { code: "29-1171", relevance: 0.5 },  // Nurse Practitioners
  ],
  "Pharmacy": [
    { code: "29-1051", relevance: 1.0 },  // Pharmacists
    { code: "29-2052", relevance: 0.7 },  // Pharmacy Technicians
  ],
  "Dentistry (Pre-Dental)": [
    { code: "29-1021", relevance: 1.0 },  // Dentists, General
    { code: "29-1029", relevance: 0.8 },  // Dentists, All Other Specialists
    { code: "29-1292", relevance: 0.5 },  // Dental Hygienists
  ],
  "Psychology": [
    { code: "19-3039", relevance: 1.0 },  // Psychologists, All Other
    { code: "19-3033", relevance: 0.9 },  // Clinical and Counseling Psychologists
    { code: "19-3032", relevance: 0.8 },  // Industrial-Organizational Psychologists
    { code: "21-1018", relevance: 0.7 },  // Substance Abuse, Behavioral Disorder, and Mental Health Counselors
    { code: "21-1019", relevance: 0.6 },  // Counselors, All Other
  ],
  "Social Work": [
    { code: "21-1029", relevance: 1.0 },  // Social Workers, All Other
    { code: "21-1021", relevance: 0.9 },  // Child, Family, and School Social Workers
    { code: "21-1022", relevance: 0.9 },  // Healthcare Social Workers
    { code: "21-1023", relevance: 0.8 },  // Mental Health and Substance Abuse Social Workers
    { code: "21-1018", relevance: 0.6 },  // Substance Abuse, Behavioral Disorder, and Mental Health Counselors
    { code: "11-9151", relevance: 0.5 },  // Social and Community Service Managers
  ],
  "Accounting": [
    { code: "13-2011", relevance: 1.0 },  // Accountants and Auditors
    { code: "13-2082", relevance: 0.7 },  // Tax Preparers
    { code: "13-2041", relevance: 0.6 },  // Credit Analysts
    { code: "11-3031", relevance: 0.5 },  // Financial Managers
    { code: "13-2061", relevance: 0.5 },  // Financial Examiners
  ],
  "Finance": [
    { code: "13-2051", relevance: 1.0 },  // Financial and Investment Analysts
    { code: "13-2052", relevance: 0.9 },  // Personal Financial Advisors
    { code: "11-3031", relevance: 0.8 },  // Financial Managers
    { code: "13-2061", relevance: 0.7 },  // Financial Examiners
    { code: "13-2041", relevance: 0.6 },  // Credit Analysts
    { code: "13-2099", relevance: 0.5 },  // Financial Specialists, All Other
  ],
  "Business Administration": [
    { code: "13-1111", relevance: 0.8 },  // Management Analysts
    { code: "11-1021", relevance: 0.7 },  // General and Operations Managers
    { code: "11-2022", relevance: 0.6 },  // Sales Managers
    { code: "11-3031", relevance: 0.6 },  // Financial Managers
    { code: "11-3012", relevance: 0.6 },  // Administrative Services Managers
    { code: "11-3013", relevance: 0.6 },  // Facilities Managers
    { code: "13-1071", relevance: 0.5 },  // Human Resources Specialists
    { code: "11-9199", relevance: 0.5 },  // Managers, All Other
  ],
  "Marketing": [
    { code: "11-2021", relevance: 1.0 },  // Marketing Managers
    { code: "13-1161", relevance: 0.9 },  // Market Research Analysts
    { code: "11-2011", relevance: 0.7 },  // Advertising and Promotions Managers
    { code: "27-3031", relevance: 0.6 },  // Public Relations Specialists
    { code: "41-3011", relevance: 0.5 },  // Advertising Sales Agents
  ],
  "Economics": [
    { code: "19-3011", relevance: 1.0 },  // Economists
    { code: "13-2051", relevance: 0.7 },  // Financial and Investment Analysts
    { code: "13-1111", relevance: 0.6 },  // Management Analysts
    { code: "15-2031", relevance: 0.6 },  // Operations Research Analysts
    { code: "15-2041", relevance: 0.5 },  // Statisticians
  ],
  "Law (Pre-Law / JD)": [
    { code: "23-1011", relevance: 1.0 },  // Lawyers
    { code: "23-1012", relevance: 0.7 },  // Judicial Law Clerks
    { code: "23-1023", relevance: 0.6 },  // Judges, Magistrate Judges, and Magistrates
    { code: "23-1022", relevance: 0.5 },  // Arbitrators, Mediators, and Conciliators
    { code: "23-2011", relevance: 0.4 },  // Paralegals and Legal Assistants
  ],
  "Architecture": [
    { code: "17-1011", relevance: 1.0 },  // Architects, Except Landscape and Naval
    { code: "17-1012", relevance: 0.6 },  // Landscape Architects
    { code: "11-9041", relevance: 0.5 },  // Architectural and Engineering Managers
    { code: "17-3011", relevance: 0.5 },  // Architectural and Civil Drafters
  ],
  "Education (Elementary)": [
    { code: "25-2021", relevance: 1.0 },  // Elementary School Teachers
    { code: "25-2012", relevance: 0.7 },  // Kindergarten Teachers
    { code: "25-2059", relevance: 0.6 },  // Special Education Teachers, All Other
    { code: "25-9031", relevance: 0.5 },  // Instructional Coordinators
    { code: "11-9032", relevance: 0.4 },  // Education Administrators, Kindergarten through Secondary
  ],
  "Education (Secondary)": [
    { code: "25-2031", relevance: 1.0 },  // Secondary School Teachers
    { code: "25-2059", relevance: 0.6 },  // Special Education Teachers, All Other
    { code: "25-9031", relevance: 0.5 },  // Instructional Coordinators
    { code: "11-9032", relevance: 0.4 },  // Education Administrators
  ],
  "Communications / Journalism": [
    { code: "27-3023", relevance: 1.0 },  // News Analysts, Reporters, and Journalists
    { code: "27-3031", relevance: 0.8 },  // Public Relations Specialists
    { code: "27-3041", relevance: 0.7 },  // Editors
    { code: "27-3043", relevance: 0.7 },  // Writers and Authors
    { code: "27-3099", relevance: 0.5 },  // Media and Communication Workers, All Other
    { code: "11-2032", relevance: 0.5 },  // Public Relations Managers
  ],
  "Graphic Design": [
    { code: "27-1024", relevance: 1.0 },  // Graphic Designers
    { code: "27-1011", relevance: 0.7 },  // Art Directors
    { code: "15-1255", relevance: 0.6 },  // Web and Digital Interface Designers
    { code: "27-1029", relevance: 0.5 },  // Designers, All Other
  ],
  "Political Science": [
    { code: "19-3094", relevance: 1.0 },  // Political Scientists
    { code: "23-1011", relevance: 0.5 },  // Lawyers
    { code: "13-1111", relevance: 0.4 },  // Management Analysts
    { code: "19-3051", relevance: 0.4 },  // Urban and Regional Planners
  ],
  "Criminal Justice": [
    { code: "33-3051", relevance: 0.9 },  // Police and Sheriff's Patrol Officers
    { code: "33-1012", relevance: 0.7 },  // First-Line Supervisors of Police
    { code: "33-3021", relevance: 0.7 },  // Detectives and Criminal Investigators
    { code: "21-1092", relevance: 0.6 },  // Probation Officers
    { code: "33-9032", relevance: 0.5 },  // Security Guards
    { code: "23-2011", relevance: 0.4 },  // Paralegals and Legal Assistants
  ],
  "Environmental Science": [
    { code: "19-2041", relevance: 1.0 },  // Environmental Scientists and Specialists
    { code: "17-2081", relevance: 0.7 },  // Environmental Engineers
    { code: "19-4042", relevance: 0.7 },  // Environmental Science and Protection Technicians
    { code: "19-1031", relevance: 0.6 },  // Conservation Scientists
    { code: "19-2043", relevance: 0.5 },  // Hydrologists
  ],
  "Human Resources": [
    { code: "13-1071", relevance: 1.0 },  // Human Resources Specialists
    { code: "11-3121", relevance: 0.9 },  // Human Resources Managers
    { code: "13-1075", relevance: 0.7 },  // Labor Relations Specialists
    { code: "13-1151", relevance: 0.6 },  // Training and Development Specialists
    { code: "11-3131", relevance: 0.6 },  // Training and Development Managers
  ],
  "Supply Chain / Logistics": [
    { code: "13-1081", relevance: 1.0 },  // Logisticians
    { code: "11-3071", relevance: 0.8 },  // Transportation, Storage, and Distribution Managers
    { code: "13-1020", relevance: 0.7 },  // Buyers and Purchasing Agents
    { code: "11-3061", relevance: 0.6 },  // Purchasing Managers
    { code: "43-5071", relevance: 0.4 },  // Shipping, Receiving, and Inventory Clerks
  ],
  "Hospitality Management": [
    { code: "11-9081", relevance: 1.0 },  // Lodging Managers
    { code: "35-1012", relevance: 0.8 },  // First-Line Supervisors of Food Preparation
    { code: "11-9051", relevance: 0.7 },  // Food Service Managers
    { code: "39-7010", relevance: 0.5 },  // Tour and Travel Guides
  ],
  "Physical Therapy": [
    { code: "29-1123", relevance: 1.0 },  // Physical Therapists
    { code: "31-2021", relevance: 0.7 },  // Physical Therapist Assistants
    { code: "31-2022", relevance: 0.5 },  // Physical Therapist Aides
  ],
  "Occupational Therapy": [
    { code: "29-1122", relevance: 1.0 },  // Occupational Therapists
    { code: "31-2011", relevance: 0.7 },  // Occupational Therapy Assistants
  ],
};

async function main() {
  console.log("Seeding major-occupation mappings...");

  for (const [majorName, occupations] of Object.entries(MAJOR_OCCUPATION_MAP)) {
    const major = await prisma.major.upsert({
      where: { name: majorName },
      update: {},
      create: { name: majorName },
    });

    for (const { code, relevance } of occupations) {
      const occupation = await prisma.occupationSubCategory.findFirst({
        where: { occupation_code: code },
      });

      if (!occupation) {
        console.warn(`  Skipping ${code} for "${majorName}" (not found in DB)`);
        continue;
      }

      await prisma.majorOccupation.upsert({
        where: {
          major_id_occupation_id: {
            major_id: major.id,
            occupation_id: occupation.id,
          },
        },
        update: { relevance },
        create: {
          major_id: major.id,
          occupation_id: occupation.id,
          relevance,
        },
      });
    }

    console.log(`  ✓ ${majorName} (${occupations.length} occupations)`);
  }

  const totalMajors = await prisma.major.count();
  const totalMappings = await prisma.majorOccupation.count();
  console.log(`Done: ${totalMajors} majors, ${totalMappings} mappings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
