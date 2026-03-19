export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative">
      {/* Ambient background blobs — per reference */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="blob"
          style={{
            width: 600,
            height: 600,
            background: "radial-gradient(circle, #4F7BF7, #7C5CF6)",
            top: -200,
            left: -150,
          }}
        />
        <div
          className="blob"
          style={{
            width: 500,
            height: 500,
            background: "radial-gradient(circle, #26C6A6, #4F7BF7)",
            top: "40%",
            right: -150,
          }}
        />
        <div
          className="blob"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, #F76B4F, #F7C94F)",
            bottom: -100,
            left: "30%",
          }}
        />
      </div>

      <div className="glass-card p-12 max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Hana
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">HRD Agent OS</p>
        <p className="mt-4 text-sm text-tertiary">
          AI HR Agent-as-a-Service untuk perusahaan SME Indonesia
        </p>

        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <span className="inline-flex items-center rounded-full bg-brand-indigo/10 px-3 py-1 text-xs font-medium text-brand-indigo">
            Compliance
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-violet/10 px-3 py-1 text-xs font-medium text-brand-violet">
            360 Assessment
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal">
            Document Drafter
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-amber/10 px-3 py-1 text-xs font-medium text-brand-coral">
            HR Helpdesk
          </span>
        </div>
      </div>
    </main>
  );
}
