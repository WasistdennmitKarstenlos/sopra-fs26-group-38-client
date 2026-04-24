"use client";

import Link from "next/link";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  LinkIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Home", href: "/dashboard", icon: HomeIcon},
  { name: "My Trips", href: "/dashboard/my-trips", icon: PaperAirplaneIcon},
  { name: "Shared Trips", href: "/dashboard/shared-trips", icon: LinkIcon},
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Sidebar({
  onLogout,
  onCollapsedChange,
}: {
  onLogout?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const { value: username } = useLocalStorage<string>("username", "");
  const { value: collapsed, set: setCollapsed } = useLocalStorage<boolean>("sidebarCollapsed", false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuPos, setUserMenuPos] = useState({ top: 0, left: 0 });
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const showExpanded = !collapsed;

  return (
    <div
      className={classNames(
        "flex flex-col border-r border-gray-200 bg-white transition-[width] duration-200",
        collapsed ? "w-full items-center px-3 overflow-y-auto" : "w-full px-6 overflow-y-auto",
      )}
    >
      {/* Header */}
      <div
        className={classNames(
          "flex h-16 shrink-0 items-center",
          showExpanded ? "justify-between" : "flex-col justify-center gap-1 pt-2",
        )}
      >
        {showExpanded ? (
          <>
            <img alt="TripSync logo" src="/logo.png" className="h-8 w-auto" />
            <button
              type="button"
              onClick={toggle}
              className="flex items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
          </>
        ) : (
          <>
            <img alt="TripSync" src="/favicon.png" className="size-6 rounded" />
            <button
              type="button"
              onClick={toggle}
              className="flex items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className={classNames("-mx-2 space-y-1", !showExpanded && "flex flex-col items-center")}>
              {navigation.map((item) => {
                const current = pathname === item.href;
                return(
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={!showExpanded ? item.name : undefined}
                      className={classNames(
                        current
                          ? "bg-gray-50 text-[#1E88E5]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]",
                        "group flex rounded-md p-2 text-sm/6 font-semibold",
                        showExpanded ? "gap-x-3" : "justify-center",
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={classNames(
                          current ? "text-[#1E88E5]" : "text-gray-400 group-hover:text-[#1E88E5]",
                          "size-6 shrink-0",
                        )}
                      />
                      {showExpanded && item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User section */}
          <li className={classNames("-mx-6 mt-auto", !showExpanded && "-mx-3")}>
            {collapsed ? (
              <div className="flex flex-col items-center py-3 px-1">
                <button
                  ref={userButtonRef}
                  type="button"
                  onClick={() => {
                    if (userButtonRef.current) {
                      const rect = userButtonRef.current.getBoundingClientRect();
                      setUserMenuPos({ top: rect.top, left: rect.left });
                    }
                    setUserMenuOpen((o) => !o);
                  }}
                  className="flex items-center justify-center rounded-md p-1 hover:bg-gray-50"
                  aria-label="User menu"
                >
                  <UserCircleIcon aria-hidden="true" className="size-8 text-gray-400" />
                </button>
                {userMenuOpen && onLogout && (
                  <div
                    style={{ position: "fixed", bottom: `calc(100vh - ${userMenuPos.top}px + 6px)`, left: userMenuPos.left }}
                    className="z-50 min-w-[140px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">
                      {mounted ? (username || "User") : "User"}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); onLogout(); }}
                      className="w-full px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50">
                <UserCircleIcon aria-hidden="true" className="size-8 shrink-0 text-gray-400" />
                <span className="sr-only">Your profile</span>
                <div className="flex items-center gap-x-2">
                  <span aria-hidden="true">{mounted ? (username || "User") : "User"}</span>
                  {onLogout ? (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="cursor-pointer text-sm/6 font-semibold text-gray-700 hover:text-[#1E88E5]"
                    >
                      (Logout)
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
