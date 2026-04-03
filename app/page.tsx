"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app-dark px-6 py-10 md:px-10">
      <main className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <Image
          className="mb-6"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-700">
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-semibold">app/page.tsx</code>{" "}
            is the landing page for your application, currently being displayed.
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-semibold">app/login/page.tsx</code> is the login page for users.
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-semibold">app/users/page.tsx</code>{" "}
            is the dashboard that shows an overview of all users, fetched from
            the server.
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-semibold">app/users/[id]/page.tsx</code>{" "}
            is a slug page that shows info of a particular user. Since each user
            has its own id, each user has its own infopage, dynamically with the
            use of slugs.
          </li>
          <li>
            To test, modify the current page <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-semibold">app/page.tsx</code>{" "}
            and save to see your changes instantly.
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            onClick={() =>
              globalThis.open("https://vercel.com/new", "_blank", "noopener,noreferrer")
            }
          >
            Deploy now
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() =>
              globalThis.open("https://nextjs.org/docs", "_blank", "noopener,noreferrer")
            }
          >
            Read our docs
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            onClick={() => router.push("/login")}
          >
            Go to login
          </button>
        </div>
      </main>
      <footer className="mx-auto mt-4 flex w-full max-w-5xl flex-wrap gap-3 text-sm">
        <a
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn
        </a>
        <a
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Examples
        </a>
        <a
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to nextjs.org
        </a>
      </footer>
    </div>
  );
}

