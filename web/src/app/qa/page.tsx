'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const QA_DATA = [
  {
    q: 'How do QR Code Labels work?',
    a: "Every asset registered in the system generates a unique, permanent QR code. You can export these codes as a PDF grid, print them on sticker labels, and affix them to your physical assets. Scanning the code instantly pulls up the asset's complete history on your mobile device."
  },
  {
    q: 'Can I book a shared resource like a company car?',
    a: 'Yes. The Bookings module allows you to view a calendar of all shared resources (like company vehicles, projectors, or conference rooms) and reserve a time slot. The system automatically prevents double-booking and handles calendar conflicts.'
  },
  {
    q: 'What is the difference between an Allocation and a Transfer?',
    a: 'An Allocation is when an asset is assigned from the general pool directly to an employee (e.g., giving a new hire a laptop). A Transfer is when an asset moves between two employees or two departments, which requires an approval workflow and maintains the chain of custody.'
  },
  {
    q: 'How do I report a broken asset?',
    a: 'Navigate to the Maintenance tab and log a repair request against the specific asset. This will alert the IT or Facilities team to schedule a repair or order replacement parts. The asset state will automatically be changed to "Maintenance".'
  },
  {
    q: 'Does AssetFlow support Role-Based Access Control (RBAC)?',
    a: 'Absolutely. AssetFlow supports Admin, Manager, and standard User roles. Standard users can only view assets they own or have been allocated, and they cannot delete audit cycles or approve their own transfers. Managers have departmental visibility, and Admins have global access.'
  },
  {
    q: 'How are audits conducted?',
    a: 'Audits can be generated globally or per department. Auditors receive a digital checklist of expected assets. They can use any mobile device to scan the physical QR codes on the assets, which instantly reconciles them against the database. Any unscanned assets are flagged as Missing.'
  },
  {
    q: 'Can I import my existing assets from Excel or CSV?',
    a: 'Yes. In the Asset Registry, clicking the "Import" button allows you to upload a standard CSV or Excel file. The system will automatically map your columns (Name, Serial Number, Department) and generate new QR codes for the imported batch.'
  },
  {
    q: 'What happens if a QR label is damaged or falls off?',
    a: 'Since the QR code is mathematically tied to the asset ID in the database, you can simply search for the asset by its Serial Number or Name in the registry, and click "Print Label" to generate a brand new physical sticker for it.'
  },
  {
    q: 'Is there a mobile app?',
    a: 'AssetFlow is a fully responsive Progressive Web App (PWA). You do not need to download anything from an App Store. You can simply open the dashboard on your phone browser, save it to your home screen, and it will function exactly like a native app, including using your phone camera for QR scanning.'
  },
  {
    q: 'How is depreciation handled?',
    a: 'AssetFlow tracks the initial purchase price and date of procurement. You can configure custom depreciation schedules (Straight-line or Double Declining) per asset category. The system automatically calculates the current book value of your entire inventory for accounting purposes.'
  },
  {
    q: 'Can we integrate AssetFlow with our existing HR system?',
    a: 'Yes. AssetFlow provides a secure REST API. You can integrate it with systems like Workday or BambooHR so that when a new employee is onboarded, an asset allocation workflow is automatically triggered.'
  },
  {
    q: 'What happens when an employee leaves the company?',
    a: 'When an employee is marked as offboarded, the system flags all assets currently allocated to them as "Pending Return". A workflow is generated for the IT or Facilities team to collect and verify the condition of the returned assets.'
  },
  {
    q: 'Are maintenance costs tracked?',
    a: 'Yes. When closing a Maintenance ticket, the technician can input the cost of parts and labor. This cost is appended to the asset’s ledger, allowing managers to see if an aging asset is costing more to repair than it would cost to replace.'
  },
  {
    q: 'Can I restrict which departments can book a specific resource?',
    a: 'Yes. Shared resources can be scoped. For example, a specialized "Engineering Test Server" can be set so that it is only visible and bookable by employees within the Engineering department.'
  },
  {
    q: 'Where is my data hosted?',
    a: 'AssetFlow is hosted on enterprise-grade cloud infrastructure with multiple redundancies. All data is encrypted at rest using AES-256 and in transit via TLS 1.3. We also offer dedicated VPC deployments for enterprise customers with strict data residency requirements.'
  }
];

export default function QAPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/20">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200 shadow-sm">
        <nav className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/about" className="hover:text-blue-600 transition">About Us</Link>
            <Link href="/qa" className="text-blue-600">Q&A</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 animate-enter">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600">Everything you need to know about how AssetFlow works under the hood.</p>
        </div>
        
        <div className="space-y-4">
          {QA_DATA.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={cn(
                  "bg-white border rounded-2xl overflow-hidden transition-all duration-200",
                  isOpen ? "border-blue-300 shadow-md shadow-blue-900/5" : "border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none"
                >
                  <span className={cn("text-lg font-bold pr-4", isOpen ? "text-blue-700" : "text-slate-900")}>
                    {item.q}
                  </span>
                  <span className={cn("flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200 shrink-0", isOpen ? "bg-blue-100 text-blue-700 rotate-180" : "bg-slate-100 text-slate-500")}>
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </button>
                <div 
                  className={cn(
                    "px-5 sm:px-6 pb-6 text-slate-600 leading-relaxed text-[15px] sm:text-base",
                    !isOpen && "hidden"
                  )}
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
