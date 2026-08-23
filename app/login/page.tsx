import { Bird, House, FileText } from "lucide-react";

import { LoginForm } from "./login-form";

const stats = [
  { value: <Bird className="size-5 text-white" />, label: "birds tracked" }, 
  { value: <House className="size-5 text-white"/>, label: "poultry houses" },
  { value: <FileText className="size-5 text-white" />, label: "record accuracy" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        style={{
          backgroundImage:
            "linear-gradient(160deg, #5B21B6 0%, #7C3AED 55%, #8B5CF6 100%)",
        }}
        className="flex flex-col justify-between gap-12 p-10 lg:w-[620px] lg:p-14 hidden lg:flex"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-[38px] items-center justify-center rounded-nav bg-white/15">
            <Bird className="size-5 text-white" />
          </span>
          <span className="text-[19px] font-semibold text-white">
            Jayda Farms
          </span>
        </div>

        <div className="flex max-w-[508px] flex-col gap-5">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-1px] text-white lg:text-[40px]">
            Every bird, every record, one place.
          </h1>
          <p className="text-lg leading-[1.55] text-white/80">
            Jayda Farms brings flock performance, feed, health, sales and
            finance into a single operating system your whole team can use.
          </p>
        </div>

        <dl className="flex flex-wrap gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="text-2xl font-semibold text-white">
                  {stat.value}
              </dt>
              <dd className="text-sm text-white/70">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-card p-6 lg:p-10">
        <div className="flex w-full max-w-[540px] items-center gap-2 lg:hidden">
          <span className="flex size-[38px] items-center justify-center rounded-nav bg-white/15">
            <Bird className="size-5 text-link" />
          </span>
          <h1 className="text-3xl font-semibold text-link">Jayda Farms</h1>
        </div>

        <LoginForm next={typeof next === "string" ? next : undefined} />
      </main>
    </div>
  );
}
