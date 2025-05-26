'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

// Sample event data - this will be replaced with data from Zoho Creator
const sampleEvents = [
  {
    id: '4433256000008960019',
    name: 'Nexpo Tech Conference 2024',
    date: '2024-03-15',
    location: 'HCMC, Vietnam',
    type: 'conference'
  },
  {
    id: '4433256000008960020',
    name: 'Nexpo Workshop: AI & ML',
    date: '2024-03-20',
    location: 'Hanoi, Vietnam',
    type: 'workshop'
  },
  {
    id: '4433256000008960021',
    name: 'Nexpo Networking Event',
    date: '2024-03-25',
    location: 'Da Nang, Vietnam',
    type: 'networking'
  }
];

interface MenuItem {
  label: string;
  href?: string;
  type?: string;
  bold?: boolean;
  dropdown?: { label: string; href: string }[];
}

const menu: MenuItem[] = [
  { label: 'HOME', href: '/', type: 'button' },
  { label: 'AGENDA', href: '/agenda' },
  { label: 'SPEAKERS', href: '/speakers' },
  { label: 'DISCUSSIONS', href: '/discussions' },
  { label: 'TICKETS', href: '/tickets' },
  { label: 'NETWORKING', href: '/networking' },
  { label: 'SPONSORS', href: '/sponsors' },
  { label: 'VENUE', href: '/venue' },
  {
    label: 'EXHIBITORS',
    dropdown: [
      { label: 'Booth Map', href: '/exhibitors/booth-map' },
      { label: 'List', href: '/exhibitors/list' },
    ],
  },
  { label: 'GALLERY', href: '/gallery' },
  { label: 'SIGN IN', href: '/signin', bold: true },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const pathname = usePathname();
  const [exhibitorsOpen, setExhibitorsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <Fragment>
      {/* Blue top bar */}
      <div className="h-1 w-full bg-blue-700" />
      <header className="bg-white">
        <nav className="max-w-7xl mx-auto px-4 flex items-center h-20 justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/nexpo-logo.png" alt="Nexpo Logo" width={120} height={60} className="object-contain" />
            </Link>
          </div>
          <ul className="flex items-center gap-5">
            {menu.map((item) => {
              if (item.label === 'HOME' && item.href) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="rounded-xl bg-blue-700 px-5 py-1.5 text-white font-extrabold text-sm tracking-wide uppercase shadow-sm hover:bg-blue-700 transition-all"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }
              if (item.label === 'EXHIBITORS' && item.dropdown) {
                return (
                  <li key={item.label} className="relative">
                    <button
                      className="flex items-center gap-1 text-black font-bold text-sm uppercase tracking-wide focus:outline-none"
                      onClick={() => setExhibitorsOpen((open) => !open)}
                      onBlur={() => setTimeout(() => setExhibitorsOpen(false), 150)}
                    >
                      {item.label}
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {exhibitorsOpen && (
                      <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg z-20">
                        <ul>
                          {item.dropdown.map((sub) => (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className="block px-4 py-2 text-black hover:bg-gray-100 text-xs font-semibold"
                                onClick={() => setExhibitorsOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              }
              if (item.href) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`text-black font-bold text-sm uppercase tracking-wide hover:text-blue-600 transition-all ${item.bold ? 'font-extrabold' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </nav>
      </header>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {menu.map((item, idx) => {
            if (item.label === 'HOME' && item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-xl bg-teal-500 px-6 py-2 text-white font-extrabold text-2xl tracking-wide uppercase shadow-sm hover:bg-teal-600 transition-all"
                >
                  {item.label}
                </Link>
              );
            }
            if (item.label === 'EXHIBITORS' && item.dropdown) {
              return (
                <div key={item.label} className="relative">
                  <button
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    onClick={() => setExhibitorsOpen((open) => !open)}
                  >
                    {item.label}
                  </button>
                  {exhibitorsOpen && (
                    <div className="pl-4">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          onClick={() => {
                            setExhibitorsOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  {item.label}
                </Link>
              );
            }
            return null;
          })}
        </div>
      </div>
    </Fragment>
  );
}
