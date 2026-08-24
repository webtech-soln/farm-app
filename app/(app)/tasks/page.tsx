import {
  Check,
  Clock3,
  Columns3,
  List,
} from "lucide-react";

import {
  DeleteTaskDialog,
  TaskDialog,
  TaskStatusDialog,
} from "@/components/dialogs/people-dialogs";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { getAssigneeOptions } from "@/lib/data/employees";
import { numberParam, param } from "@/lib/pagination";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  getTaskBoard,
  getTaskCounts,
  getTaskFormValues,
  priorityTone,
} from "@/lib/data/tasks";
import { toneBg, toneSolid, toneText } from "@/components/ui/tone";
import { cn } from "@/lib/cn";



export default async function TasksPage({
  searchParams,
}: PageProps<"/tasks">) {
  const params = await searchParams;
  const assignee = numberParam(params, "assignee", 0, { max: 2_147_483_647 });
  const priority = param(params, "priority");
  const list = param(params, "view") === "list";

  const [taskBoard, counts, people, formValues] = await Promise.all([
    getTaskBoard({
      assigneeId: assignee || undefined,
      priority: priority as "high" | "medium" | "low" | undefined,
    }),
    getTaskCounts(),
    getAssigneeOptions(),
    getTaskFormValues(),
  ]);

  return (
    <>
      <PageHeader
        title="Tasks"
        breadcrumb={["People", "Tasks"]}
        subtitle="Assign and track daily farm work."
      >
        <TaskDialog people={people} />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1 rounded-nav border border-border-hair bg-card p-[3px]">
          <Link
            href={{ query: { ...params, view: "list" } }}
            className={cn(
              "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-sm-plus",
              list
                ? "bg-violet-50 font-semibold text-violet-deep"
                : "font-medium text-ink-2",
            )}
          >
            <List
              className={cn("size-3.5", list ? "text-violet" : "text-ink-3")}
            />
            List
          </Link>
          <Link
            href={{ query: { ...params, view: "kanban" } }}
            className={cn(
              "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-sm-plus",
              list
                ? "font-medium text-ink-2"
                : "bg-violet-50 font-semibold text-violet-deep",
            )}
          >
            <Columns3
              className={cn("size-3.5", list ? "text-ink-3" : "text-violet")}
            />
            Kanban
          </Link>
        </div>

        <FilterBar
          className="flex-1 border-0 bg-transparent p-0 shadow-none"
          showSearch={false}
          filters={[
            {
              name: "assignee",
              label: "All assignees",
              options: people.map((person) => ({
                value: String(person.id),
                label: person.name,
              })),
            },
            {
              name: "priority",
              label: "All priorities",
              options: [
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ],
            },
          ]}
        />

        <span className="flex-1" />
        <span className="text-sm text-ink-3">
          {counts.open} open · {counts.completedToday} completed today
        </span>
      </div>

      {list ? (
        <Card className="flex flex-col">
          {taskBoard.flatMap((column) =>
            column.tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-3 border-b border-border-soft px-[18px] py-3 last:border-b-0"
              >
                <span
                  className={cn("size-2 shrink-0 rounded-full", toneSolid[column.tone])}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate text-base font-semibold",
                      column.done ? "text-ink-2" : "text-ink",
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="truncate text-xs-plus text-ink-3">
                    {task.context} · {task.detail}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-[5px] px-1.5 py-0.5 text-3xs font-semibold",
                    toneBg[priorityTone[task.priority]],
                    priorityTone[task.priority] === "violet"
                      ? "text-violet-deep"
                      : toneText[priorityTone[task.priority]],
                  )}
                >
                  {task.priority}
                </span>
                <span className="w-[120px] shrink-0 truncate text-sm text-ink-2">
                  {task.assignee}
                </span>
                <span
                  className={cn(
                    "w-[110px] shrink-0 text-sm",
                    column.done
                      ? "text-success"
                      : task.overdue
                        ? "text-error"
                        : "text-ink-2",
                  )}
                >
                  {task.due}
                </span>
                <div className="flex shrink-0 items-center">
                  <TaskStatusDialog
                    id={task.id}
                    title={task.title}
                    status={column.key}
                  />
                  <TaskDialog people={people} task={formValues.get(task.id)} />
                  <DeleteTaskDialog id={task.id} title={task.title} />
                </div>
              </div>
            )),
          )}
        </Card>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {taskBoard.map((column) => (
          <section key={column.key} className="flex flex-col gap-3">
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
              <TaskDialog people={people} status={column.key} />
            </header>

            {column.tasks.map((task) => (
              <Card key={task.id} className="flex flex-col gap-2 p-3.5">
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
                      column.done
                        ? "text-success"
                        : task.overdue
                          ? "text-error"
                          : "text-ink-2",
                    )}
                  >
                    {task.due}
                  </span>
                  <TaskStatusDialog
                    id={task.id}
                    title={task.title}
                    status={column.key}
                  />
                  <TaskDialog people={people} task={formValues.get(task.id)} />
                  <DeleteTaskDialog id={task.id} title={task.title} />
                </div>
              </Card>
            ))}
          </section>
        ))}
      </div>
      )}
    </>
  );
}
