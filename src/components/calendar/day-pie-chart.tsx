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

  const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)"];
  const percentage = Math.round((paid / total) * 100);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
    </div>
  );
}
