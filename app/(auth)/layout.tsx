export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full">
        <div className="mx-auto mb-6 max-w-md text-center">
          <p className="text-xl font-bold">LevelUp Architect</p>
          <p className="muted mt-1 text-sm">
            Stop choosing what to learn. Start the next quest.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
