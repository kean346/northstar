export type Channel = "Organic search" | "Direct" | "Social" | "Referral";
export const channels: Channel[] = [
  "Organic search",
  "Direct",
  "Social",
  "Referral",
];
export type Customer = {
  id: string;
  name: string;
  email: string;
  channel: Channel;
  start: string;
  end?: string;
  plan: string;
  price: number;
};
const names = [
  "Amara Nkosi",
  "Daniel Jacobs",
  "Lerato Molefe",
  "Oliver Smith",
  "Zara Patel",
  "Thabo Dlamini",
  "Mia Williams",
  "Noah Botha",
  "Aisha Khan",
  "Luca van Wyk",
  "Naledi Mokoena",
  "Ethan Daniels",
  "Sofia Naidoo",
  "Sipho Ndlovu",
  "Chloe Adams",
  "Kai Meyer",
  "Imani Maseko",
  "Leo Petersen",
  "Ava Brown",
  "Themba Zulu",
  "Isla Thomas",
  "Jade Wilson",
  "Ravi Govender",
  "Grace Martin",
];
export const customers: Customer[] = Array.from({ length: 96 }, (_, i) => ({
  id: `NS-${1001 + i}`,
  name:
    names[i % names.length] +
    (i >= 24 ? ` ${String.fromCharCode(65 + Math.floor(i / 24))}` : ""),
  email: `customer${i + 1}@example.com`,
  channel: channels[i % 4],
  start: new Date(
    Date.UTC(2025, i < 32 ? 0 : i < 64 ? 1 : 2, 1 + ((i * 7) % 27)),
  )
    .toISOString()
    .slice(0, 10),
  end: i % 11 === 0 ? "2025-03-18" : undefined,
  plan: ["Starter", "Growth", "Scale"][i % 3],
  price: [290, 790, 1490][i % 3],
}));
export type Transaction = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  channel: Channel;
};
export const transactions: Transaction[] = customers.flatMap((c) =>
  [0, 1, 2].flatMap((month) => {
    const date = `2025-${String(month + 1).padStart(2, "0")}-${c.start.slice(8)}`;
    return date >= c.start && (!c.end || date < c.end)
      ? [
          {
            id: `${c.id}-${month}`,
            customerId: c.id,
            date,
            amount: c.price,
            channel: c.channel,
          },
        ]
      : [];
  }),
);
export const traffic = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
  return channels.map((channel, j) => ({
    date,
    channel,
    visitors: 28 + ((i * 13 + j * 17) % 62),
  }));
}).flat();
export const periods = {
  "2025-03": "March 2025",
  "2025-02": "February 2025",
  "2025-01": "January 2025",
};
export type Period = keyof typeof periods;
export function bounds(period: Period) {
  const [year, month] = period.split("-").map(Number);
  return {
    start: `${period}-01`,
    end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
}
export function previous(period: Period): Period | "2024-12" {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7) as
    Period | "2024-12";
}
export function summarize(period: string, channel: string = "All channels") {
  const match = (c: string) => channel === "All channels" || channel === c;
  const tx = transactions.filter(
    (t) => t.date.startsWith(period) && match(t.channel),
  );
  const newCustomers = customers.filter(
    (c) => c.start.startsWith(period) && match(c.channel),
  );
  const end = new Date(
    Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0),
  )
    .toISOString()
    .slice(0, 10);
  const active = customers.filter(
    (c) => c.start <= end && (!c.end || c.end > end) && match(c.channel),
  ).length;
  const visitors = traffic
    .filter((t) => t.date.startsWith(period) && match(t.channel))
    .reduce((sum, t) => sum + t.visitors, 0);
  return {
    revenue: tx.reduce((sum, t) => sum + t.amount, 0),
    active,
    subscriptions: newCustomers.length,
    visitors,
    conversion: visitors ? (newCustomers.length / visitors) * 100 : 0,
    transactions: tx,
  };
}
export function daily(period: Period, channel = "All channels") {
  const { end } = bounds(period);
  return Array.from({ length: Number(end.slice(8)) }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const date = `${period}-${day}`;
    const prev = previous(period);
    const validPrev =
      Number(day) <=
      new Date(
        Date.UTC(Number(prev.slice(0, 4)), Number(prev.slice(5, 7)), 0),
      ).getUTCDate();
    const filter = (ch: string) => channel === "All channels" || ch === channel;
    return {
      day: i + 1,
      revenue: transactions
        .filter((t) => t.date === date && filter(t.channel))
        .reduce((s, t) => s + t.amount, 0),
      previous: validPrev
        ? transactions
            .filter((t) => t.date === `${prev}-${day}` && filter(t.channel))
            .reduce((s, t) => s + t.amount, 0)
        : null,
      customers: customers.filter((c) => c.start === date && filter(c.channel))
        .length,
    };
  });
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
export const number = (n: number) => new Intl.NumberFormat("en-ZA").format(n);
export function growth(current: number, prev: number, rate = false) {
  if (!prev && !current) return "No change";
  if (!prev) return "No prior baseline";
  const change = rate ? current - prev : ((current - prev) / prev) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}${rate ? " pp" : "%"} vs previous month`;
}
export function csv(period: Period, channel: string) {
  const rows = [
    [
      "Period",
      "Channel",
      "Revenue (ZAR)",
      "Active customers (period end)",
      "New subscriptions",
      "Eligible visitors",
      "Conversion (%)",
    ],
    ...(channel === "All channels" ? channels : [channel]).map((c) => {
      const s = summarize(period, c);
      return [
        period,
        c,
        s.revenue,
        s.active,
        s.subscriptions,
        s.visitors,
        s.conversion.toFixed(4),
      ];
    }),
  ];
  return rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}
