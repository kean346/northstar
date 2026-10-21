import { test } from "node:test";
import assert from "node:assert/strict";
import {
  channels,
  customers,
  transactions,
  summarize,
  daily,
  csv,
  previous,
  growth,
} from "../src/lib/data";
test("March revenue reconciles with transactions, daily series and channels", () => {
  const s = summarize("2025-03");
  assert.equal(
    s.revenue,
    transactions
      .filter((t) => t.date.startsWith("2025-03"))
      .reduce((n, t) => n + t.amount, 0),
  );
  assert.equal(
    daily("2025-03").reduce((n, d) => n + d.revenue, 0),
    s.revenue,
  );
  assert.equal(
    channels.reduce((n, c) => n + summarize("2025-03", c).revenue, 0),
    s.revenue,
  );
  assert.equal(s.subscriptions, 32);
  assert.equal(
    s.active,
    customers.filter(
      (c) => c.start <= "2025-03-31" && (!c.end || c.end > "2025-03-31"),
    ).length,
  );
});
test("Conversion uses aggregated counts and channel filters", () => {
  const s = summarize("2025-02");
  assert.equal(s.conversion, (s.subscriptions / s.visitors) * 100);
  for (const c of channels) {
    const x = summarize("2025-02", c);
    assert.equal(
      x.transactions.every((t) => t.channel === c),
      true,
    );
    assert.equal(x.subscriptions, 8);
  }
});
test("Month comparison respects February and percentage points", () => {
  assert.equal(previous("2025-03"), "2025-02");
  assert.equal(daily("2025-03").length, 31);
  assert.equal(daily("2025-03")[28].previous, null);
  assert.equal(growth(5, 4, true), "+1.0 pp vs previous month");
  assert.equal(growth(200, 100), "+100.0% vs previous month");
});
test("CSV contains selected channel values and no other period", () => {
  const exportText = csv("2025-02", "Direct");
  const s = summarize("2025-02", "Direct");
  assert.equal(exportText.split("\r\n").length, 2);
  assert.ok(
    exportText.includes(
      `"2025-02","Direct","${s.revenue}","${s.active}","${s.subscriptions}","${s.visitors}","${s.conversion.toFixed(4)}"`,
    ),
  );
  assert.ok(!exportText.includes("2025-03"));
});
