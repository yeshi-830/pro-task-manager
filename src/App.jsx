
import { useEffect, useMemo, useState } from "react";

const initialProjects = [
  { name: "Website redesign", color: "violet" },
  { name: "Marketing", color: "blue" },
  { name: "Client work", color: "orange" },
  { name: "Product", color: "green" },
  { name: "Internal", color: "pink" },
];

const initialTasks = [
  { id: 1, title: "Finalize homepage wireframes", project: "Website redesign", projectColor: "violet", due: "Today", priority: "High", completed: false },
  { id: 2, title: "Review Q3 content calendar", project: "Marketing", projectColor: "blue", due: "Today", priority: "Medium", completed: false },
  { id: 3, title: "Send updated proposal to client", project: "Client work", projectColor: "orange", due: "Today", priority: "High", completed: false },
  { id: 4, title: "Collect feedback from the team", project: "Website redesign", projectColor: "violet", due: "Tomorrow", priority: "Low", completed: false },
  { id: 5, title: "Update onboarding documentation", project: "Product", projectColor: "green", due: "Tomorrow", priority: "Medium", completed: false },
  { id: 6, title: "Prepare weekly team update", project: "Internal", projectColor: "pink", due: "Oct 24", priority: "Low", completed: true },
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
    check: <path d="m5 12 4 4L19 6" />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17" /></>,
    chart: <><path d="M4 19.5h16" /><path d="M7 16v-5M12 16V6M17 16V9" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></>,
    edit: <path d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3ZM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15Z" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v3h14v-3" /></>,
  };

  return <svg {...shared}>{paths[name] || null}</svg>;
}

function loadSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getLocalISODate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isISODate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTaskDueToday(task) {
  return task.due === "Today" ||
    (isISODate(task.due) && task.due === getLocalISODate());
}

function getDueDate(due) {
  if (due === "Today") return getLocalISODate();

  if (due === "Tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalISODate(tomorrow);
  }

  if (isISODate(due)) return due;

  if (typeof due === "string" && /^[A-Za-z]{3,9} \d{1,2}$/.test(due)) {
    const parsed = new Date(`${due}, ${new Date().getFullYear()}`);

    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
  }

  return "9999-12-31";
}

function isTaskOverdue(task) {
  return !task.completed &&
    isISODate(task.due) &&
    task.due < getLocalISODate();
}

function formatDueLabel(due) {
  if (!isISODate(due)) return due;
  if (due === getLocalISODate()) return "Today";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due === getLocalISODate(tomorrow)) return "Tomorrow";

  return new Date(`${due}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function App() {
  const [tasks, setTasks] = useState(() =>
    loadSaved("daymark-tasks", initialTasks)
  );

  const [projects, setProjects] = useState(() =>
    loadSaved("daymark-projects", initialProjects)
  );

  const [activeView, setActiveView] = useState("My tasks");
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState(
    () => loadSaved("daymark-projects", initialProjects)[0]?.name || ""
  );
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDue, setNewTaskDue] = useState(getLocalISODate());

  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("deadline");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [notice, setNotice] = useState("");

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("violet");

  useEffect(() => {
    try {
      localStorage.setItem("daymark-tasks", JSON.stringify(tasks));
    } catch {
      setNotice("Unable to save tasks in this browser.");
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("daymark-projects", JSON.stringify(projects));
    } catch {
      setNotice("Unable to save projects in this browser.");
    }
  }, [projects]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;

  const todayCount = tasks.filter(
    (task) => isTaskDueToday(task) && !task.completed
  ).length;

  const overdueCount = tasks.filter(isTaskOverdue).length;

  const projectColors = Object.fromEntries(
    projects.map((project) => [project.name, project.color])
  );

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const visibleTasks = useMemo(() => {
    let filtered = tasks;

    if (activeView === "Today") {
      filtered = filtered.filter(isTaskDueToday);
    } else if (activeView === "Upcoming") {
      filtered = filtered.filter(
        (task) => !isTaskDueToday(task) && !task.completed
      );
    } else if (activeView === "Completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (selectedProject) {
      filtered = filtered.filter(
        (task) => task.project === selectedProject
      );
    } else {
      filtered = filtered.filter((task) => !task.completed);
    }

    if (filterPriority !== "All") {
      filtered = filtered.filter(
        (task) => task.priority === filterPriority
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.project.toLowerCase().includes(query)
      );
    }

    const priorityOrder = { High: 1, Medium: 2, Low: 3 };

    return [...filtered].sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityOrder[a.priority] || 4) -
          (priorityOrder[b.priority] || 4);
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return getDueDate(a.due).localeCompare(getDueDate(b.due));
    });
  }, [activeView, filterPriority, search, selectedProject, tasks, sortBy]);

  const heading = selectedProject || activeView;

  const subtitle = heading === "Today"
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
    setFilterPriority("All");
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskProject(task.project);
    setNewTaskPriority(task.priority);
    setNewTaskDue(
      isISODate(task.due) ? task.due : getLocalISODate()
    );
    setShowForm(true);
  }

  function resetTaskForm() {
    setNewTaskTitle("");
    setNewTaskProject(projects[0]?.name || "");
    setNewTaskPriority("Medium");
    setNewTaskDue(getLocalISODate());
    setEditingTaskId(null);
    setShowForm(false);
  }

  function addTask(event) {
    event.preventDefault();

    const title = newTaskTitle.trim();
    if (!title) return;

    if (!newTaskProject) {
      setNotice("Create a project before adding a task.");
      return;
    }

    if (editingTaskId !== null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                project: newTaskProject,
                projectColor: projectColors[newTaskProject] || "violet",
                due: newTaskDue,
                priority: newTaskPriority,
              }
            : task
        )
      );

      setNotice("Task updated successfully.");
    } else {
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

      setNotice("Your task has been added.");
    }

    resetTaskForm();
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== id));
    setNotice("Task deleted.");
  }

  function addProject(event) {
    event.preventDefault();

    const name = newProjectName.trim();
    if (!name) return;

    if (projects.some(
      (project) => project.name.toLowerCase() === name.toLowerCase()
    )) {
      setNotice("A project with that name already exists.");
      return;
    }

    setProjects((current) => [
      ...current,
      { name, color: newProjectColor },
    ]);

    setNewTaskProject(name);
    setNewProjectName("");
    setShowProjectForm(false);
    setNotice("Project created successfully.");
  }

  function deleteProject(projectName) {
    const linkedTasks = tasks.filter(
      (task) => task.project === projectName
    ).length;

    const message = linkedTasks
      ? `"${projectName}" has ${linkedTasks} task(s). Delete the project and its tasks?`
      : `Delete the project "${projectName}"?`;

    if (!window.confirm(message)) return;

    setProjects((current) =>
      current.filter((project) => project.name !== projectName)
    );

    setTasks((current) =>
      current.filter((task) => task.project !== projectName)
    );

    if (selectedProject === projectName) {
      switchView("My tasks");
    }

    setNotice("Project deleted.");
  }

  function exportTasks() {
    const backup = {
      app: "Daymark Pro Task Manager",
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "daymark-backup.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setNotice("Backup exported successfully.");
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
          <span className="text-[21px] font-bold tracking-[-0.8px]">
            daymark<span className="text-violet-500">.</span>
          </span>
        </a>

        <button onClick={() => { resetTaskForm(); setShowForm(true); }} className="mb-9 flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 text-sm font-semibold text-white shadow-[0_7px_16px_rgba(117,101,232,0.2)] transition hover:bg-violet-600">
          <Icon name="plus" size={18} /> Add new task
        </button>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.6px] text-[#aaaabc]">Workspace</p>

        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => switchView(item.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition ${activeView === item.label && !selectedProject ? "bg-violet-50 text-violet-700" : "text-[#77788c] hover:bg-[#f7f7fb] hover:text-ink"}`}>
              <Icon name={item.icon} size={18} />
              <span className="flex-1">{item.label}</span>
              {item.count > 0 && <span className="text-[11px]">{item.count}</span>}
            </button>
          ))}
        </nav>

        <div className="mb-3 mt-9 flex items-center justify-between px-3">
          <p className="text-[10px] font-bold uppercase tracking-[1.6px] text-[#aaaabc]">Projects</p>
          <button onClick={() => setShowProjectForm(true)} className="rounded p-1 text-[#a5a5b5] hover:bg-violet-50 hover:text-violet-600" aria-label="Add project">
            <Icon name="plus" size={16} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Projects">
          {projects.map((project) => {
            const projectTasks = tasks.filter((task) => task.project === project.name);
            const done = projectTasks.filter((task) => task.completed).length;

            return (
              <div key={project.name} className={`group flex items-center rounded-xl ${selectedProject === project.name ? "bg-violet-50" : "hover:bg-[#f7f7fb]"}`}>
                <button onClick={() => switchView("My tasks", project.name)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] ${selectedProject === project.name ? "font-medium text-violet-700" : "text-[#77788c]"}`}>
                  <span className={`h-[9px] w-[9px] shrink-0 rounded-[3px] ${projectColorClasses[project.color]?.split(" ")[0] || "bg-violet-100"}`} />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="text-[11px] text-[#a5a5b5]">{done}/{projectTasks.length}</span>
                </button>
                <button onClick={() => deleteProject(project.name)} aria-label={`Delete ${project.name}`} title="Delete project" className="mr-1 rounded p-1 text-transparent group-hover:text-[#aaaabc] hover:!text-rose-500">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            );
          })}
          {!projects.length && <p className="px-3 py-2 text-xs text-[#9999aa]">No projects yet.</p>}
        </nav>

        <div className="mt-auto rounded-2xl bg-[#f7f6ff] p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Icon name="spark" size={17} />
          </div>
          <p className="text-[13px] font-semibold">Make room for focus</p>
          <p className="mt-1 text-[11px] leading-[1.65] text-[#85869a]">One thing at a time. You're doing great.</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-[#9393a6]">
            {tasks.length ? `${Math.round((completedCount / tasks.length) * 100)}% of all tasks complete` : "Add a task to get started"}
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#eeeff5] bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-11">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-white"><Icon name="check" size={20} /></span>
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
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setSearch(""); setShowSearch(false); } }} placeholder="Search tasks..." aria-label="Search tasks" className="w-32 bg-transparent text-xs outline-none sm:w-48" />
                <button type="button" onClick={() => { setShowSearch(false); setSearch(""); }} aria-label="Close search" className="text-[#9999aa]"><Icon name="close" size={15} /></button>
              </label>
            ) : (
              <button onClick={() => setShowSearch(true)} className="grid h-10 w-10 place-items-center rounded-xl text-[#89899b] hover:bg-[#f5f5fa]" aria-label="Search tasks"><Icon name="search" /></button>
            )}

            <button onClick={() => setNotice(overdueCount ? `You have ${overdueCount} overdue task(s).` : "You're all caught up on overdue tasks.")} className="relative grid h-10 w-10 place-items-center rounded-xl text-[#89899b] hover:bg-[#f5f5fa]" aria-label="Notifications">
              <Icon name="bell" />
              {overdueCount > 0 && <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-rose-400 ring-2 ring-white" />}
            </button>

            <button onClick={exportTasks} className="hidden items-center gap-2 rounded-xl border border-[#e9e9f1] px-3 py-2 text-xs font-medium text-violet-600 hover:bg-violet-50 sm:flex">
              <Icon name="download" size={15} /> Backup
            </button>

            <div className="ml-1 flex items-center gap-2.5 border-l border-[#eeeff5] pl-3 sm:pl-4">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f2e4d9] text-[11px] font-bold text-[#9a694b]">JD</div>
              <div className="hidden sm:block">
                <p className="text-[12px] font-semibold">Jamie Davis</p>
                <p className="mt-1 text-[10px] text-[#9999aa]">Personal workspace</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-9 sm:px-8 sm:pt-11 lg:px-11 lg:pb-12">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[12px] font-medium text-violet-600">{heading === "Today" ? todayLabel : "YOUR PERSONAL WORKSPACE"}</p>
              <h1 className="text-[30px] font-bold tracking-[-1.2px] sm:text-[34px]">{heading}</h1>
              <p className="mt-2 text-[13px] text-[#85869a]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowProjectForm(true)} className="flex h-11 items-center gap-2 rounded-xl border border-[#e9e9f1] bg-white px-4 text-[13px] font-semibold text-violet-600 hover:bg-violet-50">
                <Icon name="plus" size={17} /> Project
              </button>
              <button onClick={() => { resetTaskForm(); setShowForm(true); }} className="flex h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 text-[13px] font-semibold text-white shadow-[0_7px_16px_rgba(117,101,232,0.2)] hover:bg-violet-600">
                <Icon name="plus" size={17} /> New task
              </button>
            </div>
          </div>

          {!selectedProject && activeView !== "Completed" && (
            <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Task overview">
              <div className="rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#85869a]">Tasks completed</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="check" size={18} /></span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-[28px] font-bold">{completedCount}<span className="ml-1 text-base font-medium text-[#b0b0be]">/ {tasks.length}</span></p>
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
                <p className="text-[28px] font-bold">{todayCount}<span className="ml-2 text-[12px] font-medium text-[#aaaabc]">tasks to focus on</span></p>
                <p className="mt-3 text-[10px] text-[#9999aa]">{todayCount ? "You've got this — one task at a time." : "You're all caught up for today."}</p>
              </div>

              <div className="rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#85869a]">Active projects</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon name="chart" size={18} /></span>
                </div>
                <p className="text-[28px] font-bold">{projects.length}<span className="ml-2 text-[12px] font-medium text-[#aaaabc]">in workspace</span></p>
                <div className="mt-4 flex items-center">
                  {projects.slice(0, 5).map((project, index) => (
                    <span key={project.name} className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white text-[8px] font-bold ${projectColorClasses[project.color] || projectColorClasses.violet} ${index ? "-ml-1.5" : ""}`}>{project.name.slice(0, 1).toUpperCase()}</span>
                  ))}
                  <span className="ml-2 text-[10px] text-[#9999aa]">Progress updates automatically</span>
                </div>
              </div>
            </section>
          )}

          {!selectedProject && activeView !== "Completed" && projects.length > 0 && (
            <section className="mb-8 rounded-2xl border border-[#eeeff5] bg-white p-5 shadow-soft sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold">Project progress</h2>
                <p className="mt-1 text-xs text-[#9292a3]">Based on completed tasks in each project</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => {
                  const projectTasks = tasks.filter((task) => task.project === project.name);
                  const done = projectTasks.filter((task) => task.completed).length;
                  const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

                  return (
                    <button key={project.name} onClick={() => switchView("My tasks", project.name)} className="rounded-xl border border-[#f0f0f6] p-3 text-left hover:border-violet-200 hover:bg-[#fdfcff]">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold">{project.name}</span>
                        <span className="text-[10px] text-[#9292a3]">{done}/{projectTasks.length} · {percent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f6]">
                        <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {overdueCount > 0 && activeView !== "Completed" && (
            <button onClick={() => { setActiveView("My tasks"); setSelectedProject(null); setFilterPriority("All"); setSearch(""); }} className="mb-5 flex w-full items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-left hover:bg-rose-100">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-rose-600"><Icon name="bell" size={17} /></span>
              <span className="flex-1 text-[12px] text-rose-800"><strong>{overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"}</strong><span className="ml-1 hidden sm:inline">need your attention.</span></span>
              <span className="text-[11px] font-semibold text-rose-700">Review tasks →</span>
            </button>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#eeeff5] bg-white shadow-soft">
            <div className="flex flex-col justify-between gap-3 border-b border-[#f0f0f5] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold">
                  {selectedProject ? "Project tasks" : activeView === "Today" ? "Today's tasks" : activeView === "Upcoming" ? "Coming up" : activeView === "Completed" ? "Completed tasks" : "All tasks"}
                </h2>
                <span className="rounded-md bg-[#f4f4f9] px-2 py-1 text-[10px] font-medium text-[#9292a3]">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#9696a8]">
                <label htmlFor="sort-tasks" className="hidden sm:inline">Sort</label>
                <select id="sort-tasks" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-[#e9e9f1] bg-white px-2.5 py-2 text-[11px] font-medium text-[#55566b] outline-none focus:border-violet-400">
                  <option value="deadline">Deadline</option>
                  <option value="priority">Priority</option>
                  <option value="title">Task name</option>
                </select>

                <label htmlFor="priority-filter" className="hidden sm:inline">Priority</label>
                <select id="priority-filter" value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)} className="rounded-lg border border-[#e9e9f1] bg-white px-2.5 py-2 text-[11px] font-medium text-[#55566b] outline-none focus:border-violet-400">
                  <option value="All">All priorities</option>
                  <option value="High">High priority</option>
                  <option value="Medium">Medium priority</option>
                  <option value="Low">Low priority</option>
                </select>

                <button type="button" onClick={exportTasks} className="rounded-lg border border-[#e9e9f1] bg-white px-3 py-2 text-[11px] font-medium text-violet-600 hover:bg-violet-50">Export backup</button>
              </div>
            </div>

            <div className="task-scroll max-h-[470px] overflow-y-auto">
              {visibleTasks.length ? (
                <div>
                  {visibleTasks.map((task) => (
                    <article key={task.id} className="group flex min-h-[70px] items-center gap-3 border-b border-[#f3f3f7] px-5 transition hover:bg-[#fdfdff] sm:gap-4 sm:px-6">
                      <button onClick={() => toggleTask(task.id)} aria-label={task.completed ? `Mark ${task.title} as incomplete` : `Complete ${task.title}`} className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border transition ${task.completed ? "border-emerald-400 bg-emerald-400 text-white" : "border-[#d9d9e5] text-transparent hover:border-violet-400 hover:bg-violet-50"}`}>
                        {task.completed && <Icon name="check" size={12} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[12px] font-medium sm:text-[13px] ${task.completed ? "text-[#a6a6b4] line-through" : "text-[#424358]"}`}>{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className={`rounded px-1.5 py-[3px] text-[9px] font-medium ${projectColorClasses[task.projectColor || projectColors[task.project]] || projectColorClasses.violet}`}>{task.project}</span>
                          <span className="text-[10px] text-[#a0a0b0]">·</span>
                          <span className={`text-[10px] ${isTaskOverdue(task) ? "font-semibold text-rose-600" : "text-[#9999aa]"}`}>{isTaskOverdue(task) ? `Overdue · ${formatDueLabel(task.due)}` : formatDueLabel(task.due)}</span>
                          <span className={`rounded-md px-2 py-1 text-[10px] font-medium sm:hidden ${task.priority === "High" ? "bg-rose-50 text-rose-600" : task.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-[#f3f3f8] text-[#88889b]"}`}>{task.priority}</span>
                        </div>
                      </div>

                      <span className={`hidden rounded-md px-2 py-1 text-[10px] font-medium sm:inline-flex ${task.priority === "High" ? "bg-rose-50 text-rose-600" : task.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-[#f3f3f8] text-[#88889b]"}`}>
                        <span className={`mr-1.5 mt-[5px] h-1 w-1 rounded-full ${task.priority === "High" ? "bg-rose-400" : task.priority === "Medium" ? "bg-amber-400" : "bg-[#aaaabc]"}`} />
                        {task.priority}
                      </span>

                      <button onClick={() => startEditingTask(task)} aria-label={`Edit ${task.title}`} title="Edit task" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#b4b4c1] hover:bg-violet-50 hover:text-violet-600"><Icon name="edit" size={15} /></button>
                      <button onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`} title="Delete task" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#b4b4c1] hover:bg-rose-50 hover:text-rose-500"><Icon name="trash" size={16} /></button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[210px] flex-col items-center justify-center px-6 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-500"><Icon name="check" size={23} /></span>
                  <p className="text-[13px] font-semibold">{search ? "No matching tasks" : "Nothing on your list"}</p>
                  <p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-[#9292a3]">{search ? "Try another search, or clear it to see all your tasks." : "Enjoy the breathing room, or add a task when you're ready."}</p>
                  {!search && activeView !== "Completed" && <button onClick={() => { resetTaskForm(); setShowForm(true); }} className="mt-4 text-[11px] font-semibold text-violet-600">Add a task</button>}
                </div>
              )}
            </div>

            <button onClick={() => { resetTaskForm(); setShowForm(true); }} className="flex w-full items-center gap-3 px-5 py-4 text-left text-[11px] font-medium text-[#a0a0af] hover:bg-[#fcfcff] hover:text-violet-600 sm:px-6">
              <span className="grid h-[19px] w-[19px] place-items-center rounded-full border border-dashed border-[#c9c9d6]"><Icon name="plus" size={12} /></span>
              Add a task
            </button>
          </section>

          <p className="mt-5 text-center text-[10px] text-[#a5a5b3]">Small steps still move you forward. ✨</p>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[#eeeff5] bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.label} onClick={() => switchView(item.label)} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-medium ${activeView === item.label && !selectedProject ? "text-violet-600" : "text-[#9292a3]"}`}>
            <Icon name={item.icon} size={18} />{item.label}
          </button>
        ))}
      </nav>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#242238]/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) resetTaskForm(); }}>
          <form onSubmit={addTask} className="my-4 w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(31,30,58,0.2)] sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div><p className="text-[11px] font-medium text-violet-600">MAKE IT HAPPEN</p><h2 className="mt-1 text-xl font-bold">{editingTaskId !== null ? "Edit task" : "Create a task"}</h2></div>
              <button type="button" onClick={resetTaskForm} aria-label="Close" className="rounded-lg p-2 text-[#9999aa] hover:bg-[#f5f5fa]"><Icon name="close" size={18} /></button>
            </div>

            <label className="mb-2 block text-[11px] font-semibold text-[#656579]" htmlFor="task-title">Task name</label>
            <input id="task-title" autoFocus required maxLength={120} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs to get done?" className="mb-5 w-full rounded-xl border border-[#e9e9f1] px-3.5 py-3 text-[13px] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />

            <label className="mb-5 block text-[11px] font-semibold text-[#656579]" htmlFor="task-deadline">
              Deadline
              <input id="task-deadline" type="date" required value={newTaskDue} onChange={(event) => setNewTaskDue(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] font-normal outline-none focus:border-violet-400" />
            </label>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold text-[#656579]">
                Project
                <select required value={newTaskProject} onChange={(event) => setNewTaskProject(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] font-normal outline-none focus:border-violet-400">
                  {projects.map((project) => <option key={project.name} value={project.name}>{project.name}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-[#656579]">
                Priority
                <select value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] font-normal outline-none focus:border-violet-400">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetTaskForm} className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#77788c] hover:bg-[#f6f6fa]">Cancel</button>
              <button type="submit" disabled={!projects.length} className="rounded-xl bg-violet-500 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-violet-600 disabled:opacity-50">{editingTaskId !== null ? "Save changes" : "Create task"}</button>
            </div>
          </form>
        </div>
      )}

      {showProjectForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#242238]/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowProjectForm(false); setNewProjectName(""); } }}>
          <form onSubmit={addProject} className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(31,30,58,0.2)]">
            <div className="mb-6 flex items-start justify-between">
              <div><p className="text-[11px] font-medium text-violet-600">STAY ORGANIZED</p><h2 className="mt-1 text-xl font-bold">Create a project</h2></div>
              <button type="button" onClick={() => { setShowProjectForm(false); setNewProjectName(""); }} aria-label="Close" className="rounded-lg p-2 text-[#9999aa] hover:bg-[#f5f5fa]"><Icon name="close" size={18} /></button>
            </div>

            <label htmlFor="project-name" className="mb-2 block text-[11px] font-semibold text-[#656579]">Project name</label>
            <input id="project-name" autoFocus required maxLength={60} value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="e.g. University coursework" className="mb-5 w-full rounded-xl border border-[#e9e9f1] px-3.5 py-3 text-[13px] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />

            <label htmlFor="project-color" className="mb-2 block text-[11px] font-semibold text-[#656579]">Project color</label>
            <select id="project-color" value={newProjectColor} onChange={(event) => setNewProjectColor(event.target.value)} className="mb-6 w-full rounded-xl border border-[#e9e9f1] bg-white px-3 py-3 text-[12px] outline-none focus:border-violet-400">
              <option value="violet">Violet</option><option value="blue">Blue</option><option value="orange">Orange</option><option value="green">Green</option><option value="pink">Pink</option>
            </select>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowProjectForm(false); setNewProjectName(""); }} className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#77788c] hover:bg-[#f6f6fa]">Cancel</button>
              <button type="submit" className="rounded-xl bg-violet-500 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-violet-600">Create project</button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#29283c] px-4 py-3 text-center text-[12px] font-medium text-white shadow-lg lg:bottom-6">
          {notice}
        </div>
      )}
    </div>
  );
}

export default App;
