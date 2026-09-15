export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="rpg-auth-stage grid min-h-screen place-items-center p-4">
      <div className="w-full">
        <div className="mx-auto mb-6 max-w-md text-center">
          <div className="rpg-brand-mark mx-auto grid h-16 w-16 place-items-center text-2xl font-black">
            LA
          </div>
          <p className="rpg-title mt-4 text-2xl">LevelUp Architect</p>
          <p className="muted mt-2 text-xs font-bold uppercase tracking-[0.16em]">
            Your campaign awaits
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
