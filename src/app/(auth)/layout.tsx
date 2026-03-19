export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Ambient background blobs */}
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

      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
