import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Image
            src="/KeepTend-Leaf.png"
            alt="KeepTend Logo"
            width={120}
            height={120}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            KeepTend
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
            Give your plants creative, personalized names with smart photo
            analysis
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <a
              href="https://testflight.apple.com/join/DQcdaT9a"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              Available on iOS (TestFlight Beta)
            </a>
            {" "}&bull;{" "}Coming Soon on Android
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; 2025 KeepTend. Smart plant naming.</p>
        <p className="mt-2">
          A product by{" "}
          <a
            href="https://paperstreetapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700 dark:hover:text-gray-300"
          >
            Paper Street App Co.
          </a>
        </p>
      </footer>
    </div>
  );
}
