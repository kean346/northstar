"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  Command,
  CreditCard,
  LayoutDashboard,
  Menu,
  Plug,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import {
  channels,
  customers,
  transactions,
  periods,
  Period,
  summarize,
  daily,
  money,
  number,
  growth,
  previous,
  csv,
  Customer,
} from "@/lib/data";
import Chart from "./Charts";
const views = [
  "Overview",
  "Analytics",
  "Customers",
  "Reports",
  "Integrations",
  "Settings",
  "Help",
] as const;
type View = (typeof views)[number];
const icons = [
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  Plug,
  Settings,
  CircleHelp,
];
const defaults = {
  workspace: "Acme Workspace",
  compare: true,
  connections: [] as string[],
};
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const old = document.activeElement as HTMLElement;
    d?.showModal();
    d?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      d?.close();
      old?.focus();
    };
  }, []);
  return (
    <dialog
      aria-label={title}
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button aria-label="Close dialog" onClick={close}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function Dashboard() {
  const [view, setView] = useState<View>("Overview");
  const [period, setPeriod] = useState<Period>("2025-03");
  const [channel, setChannel] = useState("All channels");
  const [prefs, setPrefs] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState("name");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobile) return;
    const old = document.activeElement as HTMLElement;
    const side = sideRef.current;
    const controls = () =>
      Array.from(side?.querySelectorAll<HTMLElement>("button,a") || []);
    controls()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
      if (e.key === "Tab") {
        const items = controls();
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, [mobile]);
  useEffect(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("northstar.demo.v1") || "null",
      );
      if (
        raw &&
        typeof raw.workspace === "string" &&
        typeof raw.compare === "boolean" &&
        Array.isArray(raw.connections)
      )
        setPrefs({
          workspace: raw.workspace.slice(0, 50),
          compare: raw.compare,
          connections: raw.connections.filter(
            (x: unknown) => typeof x === "string",
          ),
        });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem("northstar.demo.v1", JSON.stringify(prefs));
  }, [prefs, loaded]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function navigate(v: View) {
    setView(v);
    setMobile(false);
    if (v === "Overview") setChannel("All channels");
  }
  const scoped = view === "Overview" ? "All channels" : channel;
  const s = summarize(period, scoped),
    p = summarize(previous(period), scoped);
  const end = `${period}-${new Date(Number(period.slice(0, 4)), Number(period.slice(5)), 0).getDate()}`;
  const isActive = (c: Customer) => c.start <= end && (!c.end || c.end > end);
  const filtered = customers
    .filter(
      (c) =>
        c.start <= end &&
        (scoped === "All channels" || c.channel === scoped) &&
        (status === "All statuses" ||
          (status === "Active" ? isActive(c) : !isActive(c))) &&
        `${c.name} ${c.email} ${c.id}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "revenue"
        ? transactions
            .filter((t) => t.customerId === b.id && t.date <= end)
            .reduce((v, t) => v + t.amount, 0) -
          transactions
            .filter((t) => t.customerId === a.id && t.date <= end)
            .reduce((v, t) => v + t.amount, 0)
        : a.name.localeCompare(b.name),
    );
  function download() {
    const blob = new Blob([csv(period, scoped)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `northstar-${period}-${scoped === "All channels" ? "all-channels" : scoped.toLowerCase().replaceAll(" ", "-")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const metricCards = [
    {
      label: "Total revenue",
      value: money(s.revenue),
      delta: growth(s.revenue, p.revenue),
      icon: CreditCard,
    },
    {
      label: "Active customers",
      value: number(s.active),
      delta: growth(s.active, p.active),
      icon: Users,
    },
    {
      label: "New subscriptions",
      value: number(s.subscriptions),
      delta: growth(s.subscriptions, p.subscriptions),
      icon: Activity,
    },
    {
      label: "Conversion rate",
      value: `${s.conversion.toFixed(2)}%`,
      delta: growth(s.conversion, p.conversion, true),
      icon: ArrowUpRight,
    },
  ];
  return (
    <div className="app">
      <aside
        ref={sideRef}
        aria-label="Workspace navigation"
        className={mobile ? "sidebar open" : "sidebar"}
      >
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Overview");
          }}
        >
          <Star size={18} fill="#9ac5fa" stroke="#9ac5fa" />
          northstar<span className="brand-dot">®</span>
        </a>
        <button className="workspace" onClick={() => navigate("Settings")}>
          <span className="workspace-icon">A</span>
          <span>{prefs.workspace}</span>
          <ChevronsUpDown size={13} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {views.slice(0, 5).map((v, i) => {
            const Icon = icons[i];
            return (
              <button
                key={v}
                aria-current={view === v ? "page" : undefined}
                className={view === v ? "nav-item active" : "nav-item"}
                onClick={() => navigate(v)}
              >
                <Icon size={16} />
                {v}
                {view === v && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note">
            <span className="status-light" /> Your next chapter, clearer.
            <p>
              Good decisions start with a<br />
              better view of your business.
            </p>
          </div>
          {views.slice(5).map((v) => {
            const Icon = icons[views.indexOf(v)];
            return (
              <button
                key={v}
                aria-current={view === v ? "page" : undefined}
                className={view === v ? "nav-item active" : "nav-item"}
                onClick={() => navigate(v)}
              >
                <Icon size={16} />
                {v === "Help" ? "Help & resources" : v}
              </button>
            );
          })}
          <button className="profile" onClick={() => navigate("Settings")}>
            <span className="avatar">AJ</span>
            <span>
              Alex Johnson<small>Demo workspace owner</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <span className="demo">
              <span />
              Demo · Fictional data
            </span>
            <button
              aria-label="Search anything" className="search-button"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={14} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="avatar small"
              aria-label="Open workspace preferences"
              onClick={() => navigate("Settings")}
            >
              AJ
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR BUSINESS, AT A GLANCE</div>
              <h1>
                {view === "Overview"
                  ? "A clearer view of growth."
                  : view === "Analytics"
                    ? "Understand what’s moving."
                    : view === "Customers"
                      ? "People behind the numbers."
                      : view === "Reports"
                        ? "The story, ready to share."
                        : view === "Integrations"
                          ? "Your tools, together."
                          : view === "Settings"
                            ? "Make yourself at home."
                            : "A little more clarity."}
              </h1>
              <p>
                {view === "Overview"
                  ? "Your business performance, in perspective. See what’s working."
                  : view === "Analytics"
                    ? "Explore revenue and acquisition across your channels."
                    : view === "Customers"
                      ? "Find your customers and follow their journey."
                      : view === "Reports"
                        ? "A consistent snapshot of your selected reporting period."
                        : view === "Integrations"
                          ? "Explore simulated connections. No external services are accessed."
                          : view === "Settings"
                            ? "Local preferences for your fictional workspace."
                            : "Definitions, guidance, and a few useful details."}
              </p>
            </div>
            {!["Settings", "Integrations", "Help"].includes(view) && (
              <label className="period-picker">
                <CalendarDays size={15} />
                <span className="sr-only">Reporting period</span>
                <select
                  aria-label="Reporting period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                >
                  {Object.entries(periods).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {["Analytics", "Customers", "Reports"].includes(view) && (
            <div className="filterbar">
              <SlidersHorizontal size={15} />
              <label>
                Channel{" "}
                <select
                  aria-label="Channel filter"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {["All channels", ...channels].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <span>
                {periods[period]} · {scoped}
              </span>
            </div>
          )}
          {["Overview", "Analytics", "Reports"].includes(view) && (
            <>
              <div className="metrics">
                {metricCards.map(({ label, value, delta, icon: Icon }) => (
                  <article className="metric" key={label}>
                    <div className="metric-label">
                      {label}
                      <Icon size={15} />
                    </div>
                    <div className="metric-number">{value}</div>
                    <div className="delta">
                      {prefs.compare ? delta : periods[period]}
                    </div>
                    {label === "Active customers" && (
                      <small>Subscribed at period end</small>
                    )}
                  </article>
                ))}
              </div>
              {view !== "Reports" && (
                <div className="chart-grid">
                  <section className="panel revenue-panel">
                    <div className="panel-header">
                      <h2>
                        {view === "Analytics"
                          ? "Revenue by transaction date"
                          : "Revenue overview"}
                      </h2>
                      <div className="legend">
                        <span>
                          <i />
                          This month
                        </span>
                        {prefs.compare && (
                          <span>
                            <i className="previous" />
                            {previous(period) === "2024-12"
                              ? "December 2024"
                              : periods[previous(period) as Period]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="chart-unit">ZAR · cumulative revenue</div>
                    <Chart
                      period={period}
                      channel={scoped}
                      compare={prefs.compare}
                    />
                    <div className="panel-footer">
                      <span>
                        {periods[period]} · month-to-date totals
                        {prefs.compare
                          ? " · previous month aligned by day"
                          : ""}
                      </span>
                      <button onClick={() => setView("Reports")}>
                        View revenue report <ArrowRight size={12} />
                      </button>
                    </div>
                  </section>
                  <section className="panel acquisition-panel">
                    <div className="panel-header">
                      <h2>Customer acquisition</h2>
                      <span className="muted">Daily</span>
                    </div>
                    <div className="chart-unit">New subscriptions · count</div>
                    <Chart period={period} channel={scoped} acquisition />
                    <div className="acquisition-total">
                      <strong>{s.subscriptions}</strong>
                      <span>
                        new subscriptions
                        {prefs.compare && (
                          <small>
                            {growth(s.subscriptions, p.subscriptions)}
                          </small>
                        )}
                      </span>
                    </div>
                  </section>
                </div>
              )}
              <section className="panel channel-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      {view === "Reports"
                        ? "Period report"
                        : "Acquisition channels"}
                    </h2>
                    {view === "Reports" && (
                      <p className="muted">
                        {periods[period]} · amounts in ZAR · {scoped}
                      </p>
                    )}
                  </div>
                  {view === "Reports" ? (
                    <button className="primary" onClick={download}>
                      <ArrowDownToLine size={14} />
                      Download CSV
                    </button>
                  ) : (
                    <button onClick={() => setView("Analytics")}>
                      View all channels <ArrowRight size={13} />
                    </button>
                  )}
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th>Visitors</th>
                        <th>Conversions</th>
                        <th>Conversion rate</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(scoped === "All channels" ? channels : [scoped]).map(
                        (c, i) => {
                          const item = summarize(period, c);
                          return (
                            <tr key={c}>
                              <td>
                                <span className={`channel-dot c${i}`} />
                                {c}
                              </td>
                              <td>{number(item.visitors)}</td>
                              <td>{item.subscriptions}</td>
                              <td>{item.conversion.toFixed(2)}%</td>
                              <td>{money(item.revenue)}</td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Total</th>
                        <td>{number(s.visitors)}</td>
                        <td>{s.subscriptions}</td>
                        <td>{s.conversion.toFixed(2)}%</td>
                        <td>{money(s.revenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="panel-footer">
                  <span>
                    Conversion = new paying subscriptions ÷ eligible visitors.
                  </span>
                  <span>Source: fictional demo data</span>
                </div>
              </section>
              {view === "Reports" && (
                <div className="insight">
                  <Sparkles size={18} />
                  <div>
                    <strong>Your reporting snapshot</strong>
                    <p>
                      {s.subscriptions} customers started subscriptions in{" "}
                      {periods[period]}, generating {money(s.revenue)} in total
                      subscription revenue across{" "}
                      {scoped === "All channels" ? "all channels" : scoped}.{" "}
                      {s.active} customers remained active at month end. CSV
                      rows contain the same channel aggregates shown above, plus
                      active customer counts.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          {view === "Customers" && (
            <section className="panel">
              <div className="customer-controls">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search customers"
                    placeholder="Search name, email or ID…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Customer status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["All statuses", "Active", "Cancelled"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select
                  aria-label="Sort customers"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="name">Name A–Z</option>
                  <option value="revenue">Lifetime revenue ↓</option>
                </select>
                <span className="muted">{filtered.length} customers</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Status at period end</th>
                      <th>Channel</th>
                      <th>Monthly price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <button
                            className="customer-link"
                            onClick={() => setSelected(c)}
                          >
                            <span className="avatar">
                              {c.name
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")}
                            </span>
                            <span>
                              {c.name}
                              <small>{c.email}</small>
                            </span>
                          </button>
                        </td>
                        <td>{c.plan}</td>
                        <td>
                          <span
                            className={
                              isActive(c) ? "badge" : "badge cancelled"
                            }
                          >
                            {isActive(c) ? "Active" : "Cancelled"}
                          </span>
                        </td>
                        <td>{c.channel}</td>
                        <td>{money(c.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtered.length && (
                <div className="empty">
                  <Search size={28} />
                  <h2>No customers found</h2>
                  <p>Try another name or broaden your filters.</p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setStatus("All statuses");
                      setChannel("All channels");
                    }}
                  >
                    Clear customer filters
                  </button>
                </div>
              )}
            </section>
          )}
          {view === "Integrations" && (
            <>
              <div className="notice">
                Simulated connections only. These switches are saved locally and
                never send data to a provider.
              </div>
              <div className="integration-grid">
                {["Stripe", "Google Analytics", "HubSpot"].map((name, i) => (
                  <section className="panel integration" key={name}>
                    <div className={`integration-logo logo${i}`}>
                      {i === 0 ? (
                        <CreditCard />
                      ) : i === 1 ? (
                        <BarChart3 />
                      ) : (
                        <Users />
                      )}
                    </div>
                    <h2>{name}</h2>
                    <p>
                      {
                        [
                          "Explore how subscription payments could appear in Northstar.",
                          "Explore how visitor and acquisition metrics could be imported.",
                          "Explore how customer records could be synchronised.",
                        ][i]
                      }
                    </p>
                    <span className="muted">
                      {prefs.connections.includes(name)
                        ? "Simulation enabled · no live data"
                        : "Not connected · demo only"}
                    </span>
                    <button
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          connections: prefs.connections.includes(name)
                            ? prefs.connections.filter((c) => c !== name)
                            : [...prefs.connections, name],
                        })
                      }
                    >
                      {prefs.connections.includes(name) ? (
                        <Check size={15} />
                      ) : (
                        <Plug size={15} />
                      )}{" "}
                      {prefs.connections.includes(name)
                        ? "Disable simulation"
                        : "Enable simulation"}
                    </button>
                  </section>
                ))}
              </div>
            </>
          )}
          {view === "Settings" && (
            <section className="panel settings">
              <h2>Workspace preferences</h2>
              <p className="muted">
                Saved in this browser. No account or personal information is
                required.
              </p>
              <label>
                Workspace name
                <input
                  maxLength={50}
                  value={prefs.workspace}
                  onChange={(e) =>
                    setPrefs({ ...prefs, workspace: e.target.value })
                  }
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={prefs.compare}
                  onChange={(e) =>
                    setPrefs({ ...prefs, compare: e.target.checked })
                  }
                />
                <span>
                  Show previous-period comparisons
                  <small>
                    Compare calendar months and align chart points by day of
                    month.
                  </small>
                </span>
              </label>
              <hr />
              <h2>A fresh perspective</h2>
              <p className="muted">
                Reset preferences, simulated connections, filters, and
                navigation. Fictional source data is immutable.
              </p>
              <button className="danger" onClick={() => setResetOpen(true)}>
                Reset demo
              </button>
            </section>
          )}
          {view === "Help" && (
            <section className="panel help">
              <h2>Meet your Northstar.</h2>
              <p>
                This is an interactive showcase, using deterministic fictional
                data from January–March 2025. All names are fictional and emails
                use example.com. No real accounts, payments, or analytics are
                connected.
              </p>
              {[
                [
                  "Revenue",
                  "Sum of subscription transactions dated within the selected calendar month. Prices and exports are denominated in South African rand (ZAR).",
                ],
                [
                  "Active customers",
                  "A period-end snapshot: subscriptions started on or before the last day of the month and not cancelled on or before that day.",
                ],
                [
                  "New subscriptions",
                  "Customers whose subscription start date falls within the selected month. Each subscription starts with a paying conversion.",
                ],
                [
                  "Conversion rate",
                  "New paying subscriptions divided by eligible visitors, multiplied by 100. Channel totals aggregate visitor and conversion counts, never daily percentages.",
                ],
                [
                  "Comparisons",
                  "Calendar month compared with the preceding calendar month. Revenue and customer changes use percentage growth; conversion changes use percentage points (pp). December 2024 has no data, so January has no prior baseline.",
                ],
                [
                  "A useful workflow",
                  "Choose a month, explore Analytics by channel, find a customer in Customers, then download the corresponding channel report. Filters stay selected between Analytics, Customers and Reports.",
                ],
                [
                  "Keyboard & privacy",
                  "Use Ctrl/⌘ K for navigation and customer search. Escape closes dialogs. Workspace preferences and simulated connections are stored only in this browser. Reset demo clears them.",
                ],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </section>
          )}
          <footer className="page-footer">
            <span>
              <Star size={12} /> northstar{" "}
              <span className="footer-separator">/</span> A little clarity goes
              a long way.
            </span>
            <span>Demo · Fictional data · Jan–Mar 2025</span>
          </footer>
        </main>
      </div>
      {selected && (
        <Modal title={selected.name} close={() => setSelected(null)}>
          <div className="detail">
            <span className="badge">Fictional customer</span>
            <p>
              {selected.email} · {selected.id}
            </p>
            <dl>
              <dt>Subscription</dt>
              <dd>
                {selected.plan} · {money(selected.price)} / month
              </dd>
              <dt>Acquisition channel</dt>
              <dd>{selected.channel}</dd>
              <dt>Started</dt>
              <dd>{selected.start}</dd>
              <dt>Status at {end}</dt>
              <dd>
                {selected.start > end
                  ? "Not started"
                  : isActive(selected)
                    ? "Active"
                    : "Cancelled"}
                {selected.end && ` · cancellation ${selected.end}`}
              </dd>
              <dt>Revenue in {periods[period]}</dt>
              <dd>
                {money(
                  transactions
                    .filter(
                      (t) =>
                        t.customerId === selected.id &&
                        t.date.startsWith(period),
                    )
                    .reduce((v, t) => v + t.amount, 0),
                )}
              </dd>
              <dt>Lifetime revenue through {end}</dt>
              <dd>
                {money(
                  transactions
                    .filter(
                      (t) => t.customerId === selected.id && t.date <= end,
                    )
                    .reduce((v, t) => v + t.amount, 0),
                )}
              </dd>
            </dl>
            <h3>Activity through selected period</h3>
            <ul className="activity-list">
              {transactions
                .filter((t) => t.customerId === selected.id && t.date <= end)
                .map((t) => (
                  <li key={t.id}>
                    <span>{t.date} · Subscription payment</span>
                    <strong>{money(t.amount)}</strong>
                  </li>
                ))}
              {selected.end && selected.end <= end && (
                <li>{selected.end} · Subscription cancelled</li>
              )}
            </ul>
          </div>
        </Modal>
      )}
      {searchOpen && (
        <Modal title="Search workspace" close={() => setSearchOpen(false)}>
          <label className="search-field global-search">
            <Search size={18} />
            <input
              autoFocus
              aria-label="Search workspace"
              placeholder="Find a page or customer…"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
            />
          </label>
          <div className="search-results">
            {views
              .filter((v) =>
                v.toLowerCase().includes(globalQuery.toLowerCase()),
              )
              .map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    navigate(v);
                    setSearchOpen(false);
                  }}
                >
                  <LayoutDashboard size={15} />
                  {v}
                  <ArrowRight size={14} />
                </button>
              ))}
            {customers
              .filter((c) =>
                `${c.name} ${c.email}`
                  .toLowerCase()
                  .includes(globalQuery.toLowerCase()),
              )
              .slice(0, 8)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelected(c);
                    setSearchOpen(false);
                  }}
                >
                  <Users size={15} />
                  {c.name}
                  <small>{c.id}</small>
                </button>
              ))}
            {!views.some((v) =>
              v.toLowerCase().includes(globalQuery.toLowerCase()),
            ) &&
              !customers.some((c) =>
                `${c.name} ${c.email}`
                  .toLowerCase()
                  .includes(globalQuery.toLowerCase()),
              ) && <p className="muted">No matching pages or customers.</p>}
          </div>
        </Modal>
      )}
      {resetOpen && (
        <Modal title="Reset this demo?" close={() => setResetOpen(false)}>
          <p>
            Restore the original workspace name, comparisons, simulated
            connections, and filters.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setResetOpen(false)}>Keep exploring</button>
            <button
              className="danger"
              onClick={() => {
                setPrefs(defaults);
                setPeriod("2025-03");
                setChannel("All channels");
                setQuery("");
                setStatus("All statuses");
                setSort("name");
                setGlobalQuery("");
                setSelected(null);
                setSearchOpen(false);
                setMobile(false);
                setView("Overview");
                setResetOpen(false);
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
