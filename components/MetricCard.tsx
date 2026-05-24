import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { moneyTone, toMoney, toSignedMoney } from "@/lib/finance";

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  change?: { percent: number; amount: number };
  tone?: "normal" | "good" | "bad" | "auto";
  signed?: boolean;
};

export function MetricCard({ label, value, icon: Icon, change, tone = "normal", signed = false }: MetricCardProps) {
  const valueTone = tone === "auto" ? moneyTone(value) : tone;
  const changeClass = change ? (change.amount >= 0 ? "good" : "bad") : "";
  const changeSign = change && change.amount > 0 ? "+" : change && change.amount < 0 ? "-" : "";
  const showTrend = value !== 0 && (signed || tone === "auto" || tone === "good" || tone === "bad");
  const TrendIcon = value >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="card metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={18} aria-hidden />
      </div>
      <div className={`metric-value ${valueTone}`}>
        <span>{signed ? toSignedMoney(value) : toMoney(value)}</span>
        {showTrend && (
          <span className={`trend-arrow ${value >= 0 ? "up" : "down"}`} aria-hidden>
            <TrendIcon size={22} />
          </span>
        )}
      </div>
      {change && (
        <div className={`metric-change ${changeClass}`}>
          เทียบเดือนก่อน {changeSign}
          {Math.abs(change.percent).toFixed(1)}% | {changeSign}
          {toMoney(Math.abs(change.amount))}
        </div>
      )}
    </article>
  );
}
