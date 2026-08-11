import {
  ArrowRight,
  Building2,
  Check,
  Egg,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

const stats = [
  { value: "24,850", label: "birds tracked" },
  { value: "6", label: "poultry houses" },
  { value: "99.9%", label: "record accuracy" },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        style={{
          backgroundImage:
            "linear-gradient(160deg, #5B21B6 0%, #7C3AED 55%, #8B5CF6 100%)",
        }}
        className="flex flex-col justify-between gap-12 p-10 lg:w-[620px] lg:p-14"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-[38px] items-center justify-center rounded-nav bg-white/15">
            <Egg className="size-5 text-white" />
          </span>
          <span className="text-[19px] font-semibold text-white">
            Jayda Farms
          </span>
        </div>

        <div className="flex max-w-[508px] flex-col gap-5">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-1px] text-white lg:text-[40px]">
            Every bird, every naira, one place.
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

      <main className="flex flex-1 items-center justify-center bg-card p-6 lg:p-10">
        <form className="flex w-full max-w-[540px] flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
              Sign in
            </h2>
            <p className="text-base-plus text-ink-2">
              Welcome back. Enter your details to continue.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm-plus font-medium text-ink-2">
                Work email
              </span>
              <span className="flex h-11 items-center gap-2.5 rounded-nav border border-border-hair bg-card px-3.5">
                <Mail className="size-[17px] shrink-0 text-ink-3" />
                <input
                  type="email"
                  autoComplete="email"
                  defaultValue="samuel@jaydafarms.com"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-3">
                <span className="flex-1 text-sm-plus font-medium text-ink-2">
                  Password
                </span>
                <span className="text-sm font-semibold text-violet-deep">
                  Forgot password?
                </span>
              </span>
              <span className="flex h-11 items-center gap-2.5 rounded-nav border border-border-hair bg-card px-3.5">
                <Lock className="size-[17px] shrink-0 text-violet" />
                <input
                  type="password"
                  autoComplete="current-password"
                  defaultValue="farmpassword"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none"
                />
                <EyeOff className="size-[17px] shrink-0 text-ink-3" />
              </span>
            </label>

            <span className="flex items-center gap-2.5">
              <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-violet">
                <Check className="size-3 text-white" />
              </span>
              <span className="text-sm-plus text-ink-2">
                Keep me signed in on this device
              </span>
            </span>
          </div>

          <button
            type="submit"
            className="flex h-[46px] items-center justify-center gap-2 rounded-nav bg-violet text-[14px] font-semibold text-white hover:bg-violet-deep"
          >
            Sign in
            <ArrowRight className="size-[17px]" />
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border-hair" />
            <span className="text-xs-plus text-ink-3">or</span>
            <span className="h-px flex-1 bg-border-hair" />
          </div>

          <button
            type="button"
            className="flex h-[46px] items-center justify-center gap-2 rounded-nav border border-border-hair bg-card text-base-plus font-medium text-ink hover:bg-border-soft"
          >
            <Building2 className="size-[17px] text-ink-2" />
            Continue with company SSO
          </button>

          <p className="flex items-center justify-center gap-1.5 text-sm-plus text-ink-2">
            New to Jayda Farms?
            <span className="font-semibold text-violet-deep">
              Request access
            </span>
          </p>
        </form>
      </main>
    </div>
  );
}
