"use client";

import useLocalStorage from "@/hooks/useLocalStorage";
import {
  HomeIcon,
  LinkIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Home", href: "#", icon: HomeIcon, current: true },
  { name: "My Trips", href: "#my-trips", icon: PaperAirplaneIcon, current: false },
  { name: "Shared Trips", href: "#shared-trips", icon: LinkIcon, current: false },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const { value: username } = useLocalStorage<string>("username", "");

  return (
    <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
      <div className="relative flex h-16 shrink-0 items-center">
        <img
          alt="TripSync logo"
          src="/logo.png"
          className="h-8 w-auto"
        />
      </div>
      <nav className="relative flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={classNames(
                      item.current ? "bg-gray-50 text-[#1E88E5]" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]",
                      "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={classNames(
                        item.current ? "text-[#1E88E5]" : "text-gray-400 group-hover:text-[#1E88E5]",
                        "size-6 shrink-0",
                      )}
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="-mx-6 mt-auto">
            <div className="flex flex-col">
              <div
                className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50"
              >
                <UserCircleIcon aria-hidden="true" className="size-8 text-gray-400" />
                <span className="sr-only">Your profile</span>
                <div className="flex items-center gap-x-2">
                  <span aria-hidden="true">{username || "User"}</span>
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
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

