import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DayPieChartProps {
  paid: number;
  missed: number;
}

export function DayPieChart({ paid, missed }: DayPieChartProps) {
  const total = paid + missed;
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const data = [
    { name: "Paid", value: paid },
    { name: "Missed", value: missed },
  ];

  const COLORS = ["var(--soft-mint)", "var(--soft-peach)"];
  const percentage = Math.round((paid / total) * 100);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160} minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={66}
            paddingAngle={3}
            stroke="rgba(22,22,24,0.8)"
            strokeWidth={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold text-white">{percentage}%</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">covered</p>
        </div>
      </div>
    </div>
  );
}
