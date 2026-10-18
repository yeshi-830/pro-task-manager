import { useEffect, useMemo, useState } from "react";

const initialTasks = [
  {
    id: 1,
    title: "Finalize homepage wireframes",
    project: "Website redesign",
    projectColor: "violet",
    due: "Today",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Review Q3 content calendar",
    project: "Marketing",
    projectColor: "blue",
    due: "Today",
    priority: "Medium",
    completed: false,
  },
  {
    id: 3,
    title: "Send updated proposal to client",
    project: "Client work",
    projectColor: "orange",
    due: "Today",
    priority: "High",
    completed: false,
  },
  {
    id: 4,
    title: "Collect feedback from the team",
    project: "Website redesign",
    projectColor: "violet",
    due: "Tomorrow",
    priority: "Low",
    completed: false,
  },
  {
    id: 5,
    title: "Update onboarding documentation",
    project: "Product",
    projectColor: "green",
    due: "Tomorrow",
    priority: "Medium",
    completed: false,
  },
  {
    id: 6,
    title: "Prepare weekly team update",
    project: "Internal",
    projectColor: "pink",
    due: "Oct 24",
    priority: "Low",
    completed: true,
  },
];

const initialProjects = [
  { name: "Website redesign", color: "violet", total: 8 },
  { name: "Marketing", color: "blue", total: 5 },
  { name: "Client work", color: "orange", total: 4 },
  { name: "Product", color: "green", total: 6 },
];

const projectColorClasses = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
};

function Icon({ name, size = 19, className = "" }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17" /></>,
    chart: <><path d="M4 19.5h16" /><path d="M7 16v-5M12 16V6M17 16V9" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3ZM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15Z" /></>,
  };

  return <svg {...shared}>{paths[name] || null}</svg>;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem("daymark-tasks");
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) ? parsed : initialTasks;
  } catch {
    return initialTasks;
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [activeView, setActiveView] = useState("My tasks");
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState(initialProjects[0].name);
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDue, setNewTaskDue] = useState(
  new Date().toLocaleDateString("en-CA")
);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("daymark-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const todayCount = tasks.filter((task) => task.due === "Today" && !task.completed).length;
  const projectColors = Object.fromEntries(
    initialProjects.map((project) => [project.name, project.color]),
  );
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const visibleTasks = useMemo(() => {
    let filtered = tasks;
    if (activeView === "Today") {
      filtered = filtered.filter((task) => task.due === "Today");
    } else if (activeView === "Upcoming") {
      filtered = filtered.filter((task) => task.due !== "Today");
    } else if (activeView === "Completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (selectedProject) {
      filtered = filtered.filter((task) => task.project === selectedProject);
    } else {
      filtered = filtered.filter((task) => !task.completed);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.project.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [activeView, search, selectedProject, tasks]);

  const heading = selectedProject || activeView;
  const subtitle =
    heading === "Today"
      ? "A fresh start. Here's what's on your plate today."
      : heading === "Completed"
        ? "Look at everything you've accomplished."
        : heading === "Upcoming"
          ? "A little planning goes a long way."
          : selectedProject
            ? `Everything you're working on in ${selectedProject}.`
            : "A little progress each day adds up to big results.";

  function switchView(view, project = null) {
    setActiveView(view);
    setSelectedProject(project);
    setSearch("");
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function addTask(event) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    setTasks((current) => [
      {
        id: Date.now(),
        title,
        project: newTaskProject,
        projectColor: projectColors[newTaskProject] || "violet",
       due: newTaskDue,
        priority: newTaskPriority,
        completed: false,
      },
      ...current,
    ]);
    setNewTaskTitle("");
    setNewTaskPriority("Medium");
    
    setShowForm(false);
    setNotice("Your task has been added.");
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setNotice("Task deleted.");
  }

  const navItems = [
    { label: "My tasks", icon: "grid", count: activeCount },
    { label: "Today", icon: "calendar", count: todayCount },
    { label: "Upcoming", icon: "chart" },
    { label: "Completed", icon: "check" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-[#eeeff5] bg-white px-5 py-7 lg:flex">
        <a href="#" className="mb-10 flex items-center gap-3 px-2" aria-label="Daymark home">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-violet-500 text-white shadow-[0_6px_14px_rgba(117,101,232,0.25)]">
            <Icon name="check" size={22} />
          </span>
          <span className="text-[21px] font-bold tracking-[-0.8px]">daymark<span className="text-violet-500">.</span></span>
        </a>

        <button
          onClick={() => setShowForm(true)}
          className="mb-9 flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 text-sm font-semibold text-white shadow-[0_7px_16px_rgba(117,101,232,0.2)] transition hover:bg-violet-600"
        >
          <Icon name="plus" size={18} />
          Add new task
        </button>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.6px] text-[#aaaabc]">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => switchView(item.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition ${
                activeView === item.label && !selectedProject
                  ? "bg-violet-50 text-violet-700"
                  : "text-[#77788c] hover:bg-[#f7f7fb] hover:text-ink"
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span className="flex-1">{item.label}</span>
              {item.count > 0 && (
                <span className={`text-[11px] ${activeView === item.label && !selectedProject ? "font-semibold text-violet-600" : "text-[#a5a5b5]"}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mb-3 mt-9 flex items-center justify-between px-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.6px] text-[#aaaabc]">Projects</p>
          <button
            onClick={() => setNotice("Project creation is coming soon.")}
            className="rounded p-1 text-[#a5a5b5] transition hover:bg-violet-50 hover:text-violet-600"
            aria-label="Add project"
            title="Add project"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
        <nav className="space-y-1" aria-label="Projects">
          {initialProjects.map((project) => (
            <button
              key={project.name}
              onClick={() => switchView("My tasks", project.name)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] transition ${
                selectedProject === project.name
                  ? "bg-violet-50 font-medium text-violet-700"
                  : "text-[#77788c] hover:bg-[#f7f7fb] hover:text-ink"
              }`}
            >
              <span className={`h-[9px] w-[9px] rounded-[3px] ${projectColorClasses[project.color].split(" ")[0]}`} />
              <span className="flex-1">{project.name}</span>
              <span className="text-[11px] text-[#a5a5b5]">{tasks.filter((task) => task.project === project.name).length}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-[#f7f6ff] p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Icon name="spark" size={17} />
          </div>
          <p className="text-[13px] font-semibold">Make room for focus</p>
          <p className="mt-1 text-[11px] leading-[1.65] text-[#85869a]">One thing at a time. You're doing great.</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full w-[68%] rounded-full bg-violet-500" />
          </div>
          <p className="mt-2 text-[10px] text-[#9393a6]">Your week is taking shape</p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#eeeff5] bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-white">
              <Icon name="check" size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight">daymark<span className="text-violet-500">.</span></span>
          </div>
          <div className="hidden text-[13px] text-[#9999aa] lg:block">
            Workspace <span className="mx-2 text-[#d2d2dc]">/</span>
            <span className="font-medium text-[#55566b]">{heading}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {showSearch ? (
              <label className="flex items-center gap-2 rounded-xl border border-[#ececf4] bg-[#fafaff] px-3 py-2">
                <Icon name="search" size={17} className="text-[#9999aa]" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearch("");
                      setShowSearch(false);
                    }
                  }}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                  className="w-32 bg-transparent text-xs outline-none placeholder:text-[#aaaabc] sm:w-48"
                />
                <button onClick={() => { setShowSearch(false); setSearch(""); }} aria-label="Close search" className="text-[#9999aa] hover:text-ink">
                  <Icon name="close" size={15} />
                </button>
              </label>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="grid h-10 w-10 place-items-center rounded-xl text-[#89899b] transition hover:bg-[#f5f5fa] hover:text-ink"
                aria-label="Search tasks"
              >
                <Icon name="search" />
              </button>
            )}
            <button
              onClick={() => setNotice("You're all caught up on notifications.")}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-[#89899b] transition hover:bg-[#f5f5fa] hover:text-ink"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-rose-400 ring-2 ring-white" />
            </button>
            <div className="ml-1 flex items-center gap-2.5 border-l border-[#eeeff5] pl-3 sm:pl-4">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f2e4d9] text-[11px] font-bold text-[#9a694b]">JD</div>
              <div className="hidden sm:block">
                <p className="text-[12px] font-semibold leading-tight">Jamie Davis</p>
                <p className="mt-1 text-[10px] text-[#9999aa]">Free plan</p>
              </div>
              <button
                onClick={() => setNotice("Settings are coming soon.")}
                className="hidden rounded-lg p-1 text-[#a3a3b3] hover:bg-[#f5f5fa] sm:block"
                aria-label="Settings"
                title="Settings"
              >
                <Icon name="dots" size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-9 sm:px-8 sm:pt-11 lg:px-11 lg:pb-12">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[12px] font-medium text-violet-600">
                {heading === "Today" ? todayLabel : "YOUR PERSONAL WORKSPACE"}
              </p>
              <h1 className="text-[30px] font-bold tracking-[-1.2px] sm:text-[34px]">{heading}</h1>
              <p className="mt-2 text-[13px] text-[#85869a]">{subtitle}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-violet-500 px-4 text-[13px] font-semibold text-white shadow-[0_7px_16px_rgba(117,101,232,0.2)] transition hover:bg-violet-600 sm:self-auto"
            >
              <Icon name="plus" size={17} />
              New task
            </button>
          </div>

          {!selectedProject && activeView !== "Completed" && (
            <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Task overview">
              <div className="rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#85869a]">Tasks completed</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="check" size={18} /></span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-[28px] font-bold tracking-[-1px]">{completedCount}<span className="ml-1 text-base font-medium text-[#b0b0be]">/ {tasks.length}</span></p>
                  <span className="pb-1 text-[10px] font-medium text-emerald-600">{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}% done</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f0f0f6]">
                  <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#85869a]">Due today</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Icon name="calendar" size={18} /></span>
                </div>
                <p className="text-[28px] font-bold tracking-[-1px]">{todayCount}<span className="ml-2 text-[12px] font-medium tracking-normal text-[#aaaabc]">tasks to focus on</span></p>
                <p className="mt-3 text-[10px] text-[#9999aa]">{todayCount ? "You've got this — one task at a time." : "You're all caught up for today."}</p>
              </div>
              <div className="rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#85869a]">Active projects</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon name="chart" size={18} /></span>
                </div>
                <p className="text-[28px] font-bold tracking-[-1px]">{initialProjects.length}<span className="ml-2 text-[12px] font-medium tracking-normal text-[#aaaabc]">in progress</span></p>
                <div className="mt-4 flex items-center">
                  {initialProjects.map((project, index) => (
                    <span key={project.name} className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white text-[8px] font-bold ${projectColorClasses[project.color]} ${index ? "-ml-1.5" : ""}`}>
                      {project.name.slice(0, 1)}
                    </span>
                  ))}
                  <span className="ml-2 text-[10px] text-[#9999aa]">Your work, organized</span>
                </div>
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#eeeff5] bg-white shadow-soft">
            <div className="flex flex-col justify-between gap-3 border-b border-[#f0f0f5] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold">{selectedProject ? "Project tasks" : activeView === "Today" ? "Today's tasks" : activeView === "Upcoming" ? "Coming up" : activeView === "Completed" ? "Completed tasks" : "All tasks"}</h2>
                <span className="rounded-md bg-[#f4f4f9] px-2 py-1 text-[10px] font-medium text-[#9292a3]">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#9696a8]">
                <span className="hidden sm:inline">Sorted by</span>
                <span className="font-medium text-[#55566b]">Due date</span>
                <Icon name="chevron" size={14} className="rotate-90 text-[#aaaabc]" />
              </div>
            </div>

            <div className="task-scroll max-h-[470px] overflow-y-auto">
              {visibleTasks.length ? (
                <div>
                  {visibleTasks.map((task) => (
                    <article key={task.id} className="group flex min-h-[70px] items-center gap-3 border-b border-[#f3f3f7] px-5 transition hover:bg-[#fdfdff] sm:gap-4 sm:px-6">
                      <button
                        onClick={() => toggleTask(task.id)}
                        aria-label={task.completed ? `Mark ${task.title} as incomplete` : `Complete ${task.title}`}
                        className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border transition ${
                          task.completed
                            ? "border-emerald-400 bg-emerald-400 text-white"
                            : "border-[#d9d9e5] text-transparent hover:border-violet-400 hover:bg-violet-50"
                        }`}
                      >
                        {task.completed && <Icon name="check" size={12} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[12px] font-medium sm:text-[13px] ${task.completed ? "text-[#a6a6b4] line-through" : "text-[#424358]"}`}>
                          {task.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-[3px] text-[9px] font-medium ${projectColorClasses[task.projectColor] || projectColorClasses.violet}`}>{task.project}</span>
                          <span className="text-[10px] text-[#a0a0b0]">·</span>
                          <span className="text-[10px] text-[#9999aa]">{task.due}</span>
                        </div>
                      </div>
                      <span className={`hidden rounded-md px-2 py-1 text-[10px] font-medium sm:inline-flex ${
                        task.priority === "High" ? "bg-rose-50 text-rose-600" : task.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-[#f3f3f8] text-[#88889b]"
                      }`}>
                        <span className={`mr-1.5 mt-[5px] h-1 w-1 rounded-full ${task.priority === "High" ? "bg-rose-400" : task.priority === "Medium" ? "bg-amber-400" : "bg-[#aaaabc]"}`} />
                        {task.priority}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-transparent transition hover:bg-rose-50 hover:text-rose-500 group-hover:text-[#b4b4c1]"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[210px] flex-col items-center justify-center px-6 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-500"><Icon name="check" size={23} /></span>
                  <p className="text-[13px] font-semibold">{search ? "No matching tasks" : "Nothing on your list"}</p>
                  <p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-[#9292a3]">
                    {search ? "Try another search, or clear it to see all your tasks." : "Enjoy the breathing room, or add a task when you're ready."}
                  </p>
                  {!search && activeView !== "Completed" && (
                    <button onClick={() => setShowForm(true)} className="mt-4 text-[11px] font-semibold text-violet-600 hover:text-violet-700">Add a task</button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-[11px] font-medium text-[#a0a0af] transition hover:bg-[#fcfcff] hover:text-violet-600 sm:px-6"
            >
              <span className="grid h-[19px] w-[19px] place-items-center rounded-full border border-dashed border-[#c9c9d6]"><Icon name="plus" size={12} /></span>
              Add a task
            </button>
          </section>

          <p className="mt-5 text-center text-[10px] text-[#a5a5b3]">Small steps still move you forward. ✨</p>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[#eeeff5] bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => switchView(item.label)}
            className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-medium ${
              activeView === item.label && !selectedProject ? "text-violet-600" : "text-[#9292a3]"
            }`}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#242238]/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <form onSubmit={addTask} className="w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(31,30,58,0.2)] sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-violet-600">MAKE IT HAPPEN</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Create a task</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close" className="rounded-lg p-2 text-[#9999aa] hover:bg-[#f5f5fa] hover:text-ink">
                <Icon name="close" size={18} />
              </button>
            </div>
            <label className="mb-2 block text-[11px] font-semibold text-[#656579]" htmlFor="task-title">Task name</label>
            <input
              id="task-title"
              autoFocus
              required
              maxLength={120}
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="What needs to get done?"
              className="mb-5 w-full rounded-xl border border-[#e9e9f1] px-3.5 py-3 text-[13px] outline-none transition placeholder:text-[#b1b1bd] focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            />
            <div className="mb-6 grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold text-[#656579]">
                Project
                <select value={newTaskProject} onChange={(event) => setNewTaskProject(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] font-normal outline-none focus:border-violet-400">
                  {initialProjects.map((project) => <option key={project.name}>{project.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-[#656579]">
                Priority
                <select value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] font-normal outline-none focus:border-violet-400">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#77788c] hover:bg-[#f6f6fa]">Cancel</button>
              <button type="submit" className="rounded-xl bg-violet-500 px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-violet-600">Create task</button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#29283c] px-4 py-3 text-[12px] font-medium text-white shadow-lg lg:bottom-6">
          {notice}
        </div>
      )}
    </div>
  );
}

export default App;
