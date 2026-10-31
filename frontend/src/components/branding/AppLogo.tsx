import { GraduationCap, TrendingUp } from "lucide-react";

type AppLogoProps = {
  showText?: boolean;
  light?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function AppLogo({
  showText = true,
  light = false,
  size = "md",
}: AppLogoProps) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizes[size]} relative shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 flex items-center justify-center shadow-md`}
      >
        <GraduationCap
          className="h-6 w-6 text-white"
          strokeWidth={2}
          aria-hidden="true"
        />
        <TrendingUp
          className="absolute bottom-1 right-1 h-3.5 w-3.5 text-emerald-300"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <span
            className={`block text-sm font-bold tracking-tight ${
              light ? "text-white" : "text-slate-900"
            }`}
          >
            AI Career Readiness
          </span>
          <span
            className={`block text-xs font-medium ${
              light ? "text-indigo-200" : "text-indigo-600"
            }`}
          >
            Assistant
          </span>
        </div>
      )}
    </div>
  );
}
