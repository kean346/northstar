"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { daily, money, Period } from "@/lib/data";
export default function Chart({
  period,
  channel,
  acquisition = false,
  compare = true,
}: {
  period: Period;
  channel: string;
  acquisition?: boolean;
  compare?: boolean;
}) {
  let revenue = 0,
    previousRevenue = 0;
  const data = daily(period, channel).map((d) => {
    revenue += d.revenue;
    previousRevenue += d.previous ?? 0;
    return {
      ...d,
      revenue,
      previous: d.previous === null ? null : previousRevenue,
    };
  });
  return (
    <div
      className="chart"
      role="img"
      aria-label={`${acquisition ? "New subscriptions by start date" : "Cumulative revenue in ZAR through each day"}, ${period}. Exact totals and channel breakdown appear in the surrounding cards and table.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {acquisition ? (
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#252b32" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              minTickGap={25}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis allowDecimals={false} width={30} />
            <Tooltip
              contentStyle={{
                background: "#1a2028",
                border: "1px solid #374151",
                borderRadius: 8,
              }}
              labelFormatter={(v) => `Day ${v}`}
            />
            <Bar
              isAnimationActive={false}
              dataKey="customers"
              name="New subscriptions"
              fill="#8db8ec"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84b2ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#84b2ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#252b32" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis width={42} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                background: "#1a2028",
                border: "1px solid #374151",
                borderRadius: 8,
              }}
              formatter={(v) => money(Number(v))}
              labelFormatter={(v) => `Day ${v}`}
            />
            {compare && (
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="previous"
                name="Previous month to date · ZAR"
                stroke="#637083"
                strokeDasharray="4 4"
                fill="transparent"
              />
            )}
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="revenue"
              name="Month to date · ZAR"
              stroke="#9cc3f4"
              fill="url(#revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
