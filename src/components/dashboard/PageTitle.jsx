export default function PageTitle() {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h1
        className="text-[28px] font-bold tracking-tight max-sm:text-[22px]"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.025em",
        }}
      >
        My Dashboard
      </h1>
    </div>
  );
}
