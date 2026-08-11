import {
  Check,
  ChevronDown,
  Clock3,
  Columns3,
  List,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { priorityTone, taskBoard } from "@/lib/data/tasks";
import { toneBg, toneSolid, toneText } from "@/components/ui/tone";
import { cn } from "@/lib/cn";

const filters = ["All assignees", "All houses", "This week"];

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        breadcrumb={["People", "Tasks"]}
        subtitle="Assign and track daily farm work."
      >
        <Button variant="secondary" icon={SlidersHorizontal}>
          Filter
        </Button>
        <Button icon={Plus}>Add Task</Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1 rounded-nav border border-border-hair bg-card p-[3px]">
          <span className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-sm-plus font-medium text-ink-2">
            <List className="size-3.5 text-ink-3" />
            List
          </span>
          <span className="flex items-center gap-1.5 rounded-[6px] bg-violet-50 px-2.5 py-1.5 text-sm-plus font-semibold text-violet-deep">
            <Columns3 className="size-3.5 text-violet" />
            Kanban
          </span>
        </div>

        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-nav border border-border-hair bg-card px-3 text-sm-plus font-medium text-ink-2 hover:bg-border-soft"
          >
            {filter}
            <ChevronDown className="size-3.5 text-ink-3" />
          </button>
        ))}

        <span className="flex-1" />
        <span className="text-sm text-ink-3">14 open · 6 completed today</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {taskBoard.map((column) => (
          <section key={column.name} className="flex flex-col gap-3">
            <header className="flex items-center gap-2">
              <span
                className={cn("size-2 rounded-full", toneSolid[column.tone])}
              />
              <h2 className="text-base font-semibold text-ink">
                {column.name}
              </h2>
              <span className="rounded-full bg-border-soft px-2 py-0.5 text-xs font-semibold text-ink-2">
                {column.count}
              </span>
              <span className="flex-1" />
              <Plus className="size-4 text-ink-3" />
            </header>

            {column.tasks.map((task) => (
              <Card key={task.title} className="flex flex-col gap-2 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-[5px] px-1.5 py-0.5 text-3xs font-semibold",
                      toneBg[priorityTone[task.priority]],
                      priorityTone[task.priority] === "violet"
                        ? "text-violet-deep"
                        : toneText[priorityTone[task.priority]],
                    )}
                  >
                    {task.priority}
                  </span>
                  <span className="rounded-[5px] bg-border-soft px-1.5 py-0.5 text-3xs font-medium text-ink-3">
                    {task.context}
                  </span>
                </div>

                <h3
                  className={cn(
                    "text-base font-semibold",
                    column.done ? "text-ink-2" : "text-ink",
                  )}
                >
                  {task.title}
                </h3>
                <p className="text-xs-plus text-ink-3">{task.detail}</p>

                <div className="flex flex-wrap items-center gap-2 border-t border-border-soft pt-2.5">
                  <Avatar initials={task.initials} size={22} />
                  <span className="flex-1 truncate text-xs-plus text-ink-2">
                    {task.assignee}
                  </span>
                  {column.done ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <Clock3 className="size-3.5 text-ink-3" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      column.done ? "text-success" : "text-ink-2",
                    )}
                  >
                    {task.due}
                  </span>
                </div>
              </Card>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
