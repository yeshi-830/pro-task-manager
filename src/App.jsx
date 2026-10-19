
import { useEffect, useMemo, useRef, useState } from "react";

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

const colors = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
};

const colorOptions = ["violet", "blue", "orange", "green", "pink"];
const priorities = ["High", "Medium", "Low"];

function Icon({ name, size = 19, className = "" }) {
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17"/></>,
    chart: <><path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16V9"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4"/></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/></>,
    edit: <path d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z"/>,
    close: <path d="m18 6-12 12M6 6l12 12"/>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 15 1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15Z"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 17v3h14v-3"/></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M5 15v5h14v-5"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
    filter: <><path d="M4 5h16M7 12h10M10 19h4"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    flag: <><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || null}
    </svg>
  );
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

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}

function isISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

function getDueDate(due) {
  if (due === "Today") return localDate();
  if (due === "Tomorrow") return shiftDate(1);
  if (isISODate(due)) return due;

  if (typeof due === "string" && /^[A-Za-z]{3,9} \d{1,2}$/.test(due)) {
    const parsed = new Date(`${due}, ${new Date().getFullYear()} 12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return localDate(parsed);
  }

  return "9999-12-31";
}

function isTaskDueToday(task) {
  return getDueDate(task.due) === localDate();
}

function isTaskOverdue(task) {
  return !task.completed && isISODate(task.due) && task.due < localDate();
}

function formatDueLabel(due) {
  const date = getDueDate(due);

  if (date === localDate()) return "Today";
  if (date === shiftDate(1)) return "Tomorrow";
  if (date === "9999-12-31") return due || "No deadline";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.slice(0, 4) === localDate().slice(0, 4) ? undefined : "numeric",
  });
}

function normalizeTask(task, projects) {
  const project = projects.find((item) => item.name === task.project);

  return {
    id: task.id ?? Date.now() + Math.random(),
    title: String(task.title || "Untitled task"),
    project: String(task.project || projects[0]?.name || "General"),
    projectColor: project?.color || task.projectColor || "violet",
    due: task.due || localDate(),
    priority: priorities.includes(task.priority) ? task.priority : "Medium",
    completed: Boolean(task.completed),
  };
}

function Button({ children, onClick, variant = "secondary", className = "", type = "button", disabled = false }) {
  const styles = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 border border-violet-600",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, detail, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </button>
  );
}

export default function App() {
  const [projects, setProjects] = useState(() =>
    loadSaved("daymark-projects", initialProjects)
  );

  const [tasks, setTasks] = useState(() => {
    const saved = loadSaved("daymark-tasks", initialTasks);
    const savedProjects = loadSaved("daymark-projects", initialProjects);
    return saved.map((task) => normalizeTask(task, savedProjects));
  });

  const [activeView, setActiveView] = useState("My tasks");
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState(
    () => loadSaved("daymark-projects", initialProjects)[0]?.name || ""
  );
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDue, setNewTaskDue] = useState(localDate());

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("violet");

  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("deadline");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const importRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("daymark-tasks", JSON.stringify(tasks));
    } catch {
      setNotice("Unable to save tasks. Your browser storage may be full.");
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("daymark-projects", JSON.stringify(projects));
    } catch {
      setNotice("Unable to save projects. Your browser storage may be full.");
    }
  }, [projects]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const todayCount = tasks.filter((task) => isTaskDueToday(task) && !task.completed).length;
  const overdueCount = tasks.filter(isTaskOverdue).length;
  const highPriorityCount = tasks.filter((task) => task.priority === "High" && !task.completed).length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const projectColors = Object.fromEntries(projects.map((project) => [project.name, project.color]));

  const visibleTasks = useMemo(() => {
    let filtered = [...tasks];

    if (activeView === "Today") {
      filtered = filtered.filter(isTaskDueToday);
    } else if (activeView === "Upcoming") {
      filtered = filtered.filter((task) => !isTaskDueToday(task) && !task.completed);
    } else if (activeView === "Completed") {
      filtered = filtered.filter((task) => task.completed);
    } else if (activeView === "Overdue") {
      filtered = filtered.filter(isTaskOverdue);
    } else if (selectedProject) {
      filtered = filtered.filter((task) => task.project === selectedProject);
    } else if (activeView === "My tasks") {
      filtered = filtered.filter((task) => !task.completed);
    }

    if (filterPriority !== "All") {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query)
      );
    }

    const priorityOrder = { High: 1, Medium: 2, Low: 3 };

    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === "newest") {
        return Number(b.id) - Number(a.id);
      }

      return getDueDate(a.due).localeCompare(getDueDate(b.due));
    });
  }, [activeView, filterPriority, search, selectedProject, tasks, sortBy]);

  const heading = selectedProject || activeView;

  const subtitle = heading === "Today"
    ? "Focus on what needs your attention today."
    : heading === "Completed"
      ? "Look at everything you've accomplished."
      : heading === "Upcoming"
        ? "Plan ahead and stay one step ahead."
        : heading === "Overdue"
          ? "These tasks need your attention."
          : selectedProject
            ? `Everything you're working on in ${selectedProject}.`
            : "Plan your work, prioritize your day, and make progress.";

  function openNewTaskForm() {
    setEditingTaskId(null);
    setNewTaskTitle("");
    setNewTaskProject(projects[0]?.name || "");
    setNewTaskPriority("Medium");
    setNewTaskDue(localDate());
    setShowForm(true);
  }

  function openEditTaskForm(task) {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskProject(task.project);
    setNewTaskPriority(task.priority);
    setNewTaskDue(getDueDate(task.due) === "9999-12-31" ? localDate() : getDueDate(task.due));
    setShowForm(true);
  }

  function saveTask(event) {
    event.preventDefault();

    const title = newTaskTitle.trim();

    if (!title) {
      setNotice("Please enter a task title.");
      return;
    }

    if (!newTaskProject) {
      setNotice("Please create or select a project first.");
      return;
    }

    const projectColor = projectColors[newTaskProject] || "violet";

    if (editingTaskId !== null) {
      setTasks((current) => current.map((task) =>
        task.id === editingTaskId
          ? { ...task, title, project: newTaskProject, projectColor, due: newTaskDue, priority: newTaskPriority }
          : task
      ));
      setNotice("Task updated successfully.");
    } else {
      setTasks((current) => [
        {
          id: Date.now(),
          title,
          project: newTaskProject,
          projectColor,
          due: newTaskDue,
          priority: newTaskPriority,
          completed: false,
        },
        ...current,
      ]);
      setNotice("Task created successfully.");
    }

    setShowForm(false);
    setEditingTaskId(null);
  }

  function toggleTask(taskId) {
    setTasks((current) => current.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  }

  function deleteTask(taskId) {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;

    setTasks((current) => current.filter((task) => task.id !== taskId));
    setSelectedIds((current) => current.filter((id) => id !== taskId));
    setNotice("Task deleted.");
  }

  function createProject(event) {
    event.preventDefault();
    const name = newProjectName.trim();

    if (!name) {
      setNotice("Please enter a project name.");
      return;
    }

    if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
      setNotice("A project with that name already exists.");
      return;
    }

    setProjects((current) => [...current, { name, color: newProjectColor }]);
    setNewTaskProject(name);
    setNewProjectName("");
    setNewProjectColor("violet");
    setShowProjectForm(false);
    setSelectedProject(name);
    setActiveView("My tasks");
    setNotice("Project created successfully.");
  }

  function toggleSelected(taskId) {
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  }

  function selectAllVisible() {
    const visibleIds = visibleTasks.map((task) => task.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  }

  function bulkComplete() {
    if (!selectedIds.length) return;

    setTasks((current) => current.map((task) =>
      selectedIds.includes(task.id) ? { ...task, completed: true } : task
    ));
    setSelectedIds([]);
    setNotice("Selected tasks marked as completed.");
  }

  function bulkDelete() {
    if (!selectedIds.length) return;

    if (!window.confirm(`Delete ${selectedIds.length} selected task(s)? This cannot be undone.`)) return;

    setTasks((current) => current.filter((task) => !selectedIds.includes(task.id)));
    setSelectedIds([]);
    setNotice("Selected tasks deleted.");
  }

  function exportTasks() {
    const backup = {
      app: "Daymark Pro",
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `daymark-backup-${localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("Backup exported successfully.");
  }

  async function importTasks(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!Array.isArray(backup.tasks) || !Array.isArray(backup.projects)) {
        throw new Error("Invalid backup format.");
      }

      const importedProjects = backup.projects
        .filter((project) => project && typeof project.name === "string" && project.name.trim())
        .map((project) => ({
          name: project.name.trim(),
          color: colorOptions.includes(project.color) ? project.color : "violet",
        }));

      if (!importedProjects.length && backup.tasks.length) {
        throw new Error("The backup does not contain valid projects.");
      }

      const uniqueProjects = [
        ...new Map(importedProjects.map((project) => [project.name.toLowerCase(), project])).values(),
      ];

      const importedTasks = backup.tasks
        .filter((task) => task && typeof task.title === "string" && task.title.trim())
        .map((task, index) => normalizeTask(
          { ...task, id: Date.now() + index + Math.random() },
          uniqueProjects
        ));

      if (!window.confirm(`Replace your current data with ${importedTasks.length} tasks and ${uniqueProjects.length} projects from this backup? Export your current data first if you want to keep it.`)) {
        event.target.value = "";
        return;
      }

      setProjects(uniqueProjects);
      setTasks(importedTasks);
      setSelectedIds([]);
      setSelectedProject(null);
      setActiveView("My tasks");
      setNotice("Backup imported successfully.");
    } catch {
      setNotice("Could not import this file. Please choose a valid Daymark JSON backup.");
    } finally {
      event.target.value = "";
    }
  }

  function resetDemoData() {
    if (!window.confirm("Restore the original demo tasks and projects? Your current data will be replaced.")) return;

    setProjects(initialProjects);
    setTasks(initialTasks.map((task) => ({ ...task })));
    setSelectedIds([]);
    setSelectedProject(null);
    setActiveView("My tasks");
    setFilterPriority("All");
    setSearch("");
    setNotice("Demo data restored.");
  }

  function navigate(view, project = null) {
    setActiveView(view);
    setSelectedProject(project);
    setSelectedIds([]);
  }

  const navItem = (label, icon, count) => {
    const active = activeView === label && !selectedProject;

    return (
      <button
        key={label}
        onClick={() => navigate(label)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon name={icon} size={18} />
        <span className="flex-1 text-left">{label}</span>
        {count > 0 && (
          <span className={`rounded-lg px-2 py-0.5 text-xs ${active ? "bg-violet-100" : "bg-slate-100"}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
          <button onClick={() => navigate("My tasks")} className="mb-9 flex items-center gap-3 px-2 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
              <Icon name="check" size={25}/>
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight text-slate-900">Daymark</span>
              <span className="text-xs font-medium text-slate-400">PRO TASK MANAGER</span>
            </span>
          </button>

          <div className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">Workspace</div>
          <nav className="space-y-1">
            {navItem("My tasks", "grid", activeCount)}
            {navItem("Today", "calendar", todayCount)}
            {navItem("Upcoming", "clock", tasks.filter((task) => !task.completed && !isTaskDueToday(task)).length)}
            {navItem("Completed", "check", completedCount)}
            {navItem("Overdue", "bell", overdueCount)}
          </nav>

          <div className="mb-2 mt-8 flex items-center justify-between px-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Projects</span>
            <button onClick={() => setShowProjectForm(true)} title="Add project" className="rounded-lg p-1 text-slate-500 hover:bg-violet-50 hover:text-violet-700">
              <Icon name="plus" size={17}/>
            </button>
          </div>

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.name}
                onClick={() => navigate("My tasks", project.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selectedProject === project.name ? "bg-violet-50 font-semibold text-violet-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${project.color === "violet" ? "bg-violet-500" : project.color === "blue" ? "bg-sky-500" : project.color === "orange" ? "bg-orange-500" : project.color === "green" ? "bg-emerald-500" : "bg-pink-500"}`}/>
                <span className="flex-1 truncate">{project.name}</span>
                <span className="text-xs text-slate-400">{tasks.filter((task) => task.project === project.name && !task.completed).length}</span>
              </button>
            ))}
            {!projects.length && <p className="px-3 py-2 text-sm text-slate-400">No projects yet.</p>}
          </div>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Icon name="spark" size={20}/>
            </span>
            <p className="mt-3 font-bold">Small steps. Big progress.</p>
            <p className="mt-1 text-xs leading-5 text-violet-100">Keep your priorities clear and celebrate every task you finish.</p>
            <button onClick={() => setShowDashboard((value) => !value)} className="mt-3 text-sm font-semibold underline underline-offset-4">
              {showDashboard ? "Hide progress" : "View progress"}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white md:hidden">
                  <Icon name="check" size={22}/>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 md:text-base">Good to see you!</p>
                  <p className="truncate text-xs text-slate-500">{todayLabel}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button onClick={() => { setShowSearch((value) => !value); setSearch(""); }} className="!p-2.5" aria-label="Toggle search">
                  <Icon name="search" size={18}/>
                </Button>
                <Button onClick={exportTasks} className="hidden sm:inline-flex">
                  <Icon name="download" size={17}/> Export
                </Button>
                <Button onClick={openNewTaskForm} variant="primary">
                  <Icon name="plus" size={18}/> <span className="hidden sm:inline">New task</span><span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, projects, or priorities..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
                </div>
              </div>
            )}
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-violet-100 p-2 text-violet-700"><Icon name="grid" size={20}/></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Your workspace</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setShowDashboard((value) => !value)}>
                  <Icon name="chart" size={17}/>{showDashboard ? "Hide stats" : "Show stats"}
                </Button>
                <Button onClick={() => setShowProjectForm(true)}>
                  <Icon name="folder" size={17}/> New project
                </Button>
              </div>
            </div>

            {showDashboard && (
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">Your progress</h2>
                    <p className="mt-1 text-xs text-slate-500">A quick look at how things are going.</p>
                  </div>
                  <span className="text-sm font-bold text-violet-700">{completionRate}% completed</span>
                </div>

                <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" style={{ width: `${completionRate}%` }}/>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard label="Active tasks" value={activeCount} detail="Tasks still in progress" icon="grid" color="bg-violet-100 text-violet-700" onClick={() => navigate("My tasks")}/>
                  <StatCard label="Due today" value={todayCount} detail="Tasks to focus on today" icon="calendar" color="bg-sky-100 text-sky-700" onClick={() => navigate("Today")}/>
                  <StatCard label="Overdue" value={overdueCount} detail="Tasks past their deadline" icon="bell" color="bg-red-100 text-red-600" onClick={() => navigate("Overdue")}/>
                  <StatCard label="Completed" value={completedCount} detail="Tasks you've finished" icon="check" color="bg-emerald-100 text-emerald-700" onClick={() => navigate("Completed")}/>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="font-bold text-slate-900">Task list</h2>
                  <p className="mt-1 text-xs text-slate-500">{visibleTasks.length} task{visibleTasks.length === 1 ? "" : "s"} found</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => setShowFilters((value) => !value)}>
                    <Icon name="filter" size={17}/> Filters
                    {(filterPriority !== "All" || sortBy !== "deadline") && <span className="h-2 w-2 rounded-full bg-violet-500"/>}
                  </Button>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                    <span className="hidden sm:inline">Sort:</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="max-w-32 bg-transparent font-medium outline-none">
                      <option value="deadline">Deadline</option>
                      <option value="priority">Priority</option>
                      <option value="title">Title A–Z</option>
                      <option value="newest">Newest</option>
                    </select>
                  </label>
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Priority
                    <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400">
                      <option value="All">All priorities</option>
                      {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </label>
                  <Button onClick={() => { setFilterPriority("All"); setSortBy("deadline"); setSearch(""); }} variant="ghost">Reset filters</Button>
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-violet-50 px-4 py-3">
                  <span className="text-sm font-semibold text-violet-800">{selectedIds.length} selected</span>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={bulkComplete} variant="primary"><Icon name="check" size={16}/> Complete selected</Button>
                    <Button onClick={bulkDelete} variant="danger"><Icon name="trash" size={16}/> Delete selected</Button>
                    <Button onClick={() => setSelectedIds([])} variant="ghost">Cancel</Button>
                  </div>
                </div>
              )}

              {visibleTasks.length > 0 && (
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">
                  <input type="checkbox" aria-label="Select all visible tasks" checked={visibleTasks.length > 0 && visibleTasks.every((task) => selectedIds.includes(task.id))} onChange={selectAllVisible} className="h-4 w-4 rounded border-slate-300 accent-violet-600"/>
                  Select all visible tasks
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {visibleTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const dueToday = isTaskDueToday(task);
                  const projectClass = colors[projectColors[task.project] || task.projectColor] || colors.violet;

                  return (
                    <article key={task.id} className={`group flex items-start gap-3 px-4 py-4 transition hover:bg-slate-50/80 sm:gap-4 sm:px-5 ${task.completed ? "opacity-70" : ""}`}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${task.title}`}
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelected(task.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-violet-600"
                      />

                      <button
                        onClick={() => toggleTask(task.id)}
                        title={task.completed ? "Mark as active" : "Mark as completed"}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-violet-500"
                        }`}
                      >
                        {task.completed && <Icon name="check" size={13}/>}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-sm font-semibold leading-6 ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                          {task.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`max-w-full truncate rounded-lg px-2 py-1 text-xs font-medium ${projectClass}`}>
                            {task.project}
                          </span>

                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            overdue ? "text-red-600" : dueToday && !task.completed ? "text-orange-600" : "text-slate-500"
                          }`}>
                            <Icon name="calendar" size={13}/>
                            {formatDueLabel(task.due)}
                            {overdue && " · Overdue"}
                          </span>

                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            task.priority === "High" ? "text-red-600" : task.priority === "Medium" ? "text-amber-600" : "text-slate-500"
                          }`}>
                            <Icon name="flag" size={13}/>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={() => openEditTaskForm(task)} title="Edit task" aria-label={`Edit ${task.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-700">
                          <Icon name="edit" size={17}/>
                        </button>
                        <button onClick={() => deleteTask(task.id)} title="Delete task" aria-label={`Delete ${task.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Icon name="trash" size={17}/>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {visibleTasks.length === 0 && (
                  <div className="px-5 py-16 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <Icon name="check" size={27}/>
                    </span>
                    <h3 className="mt-4 font-bold text-slate-900">Nothing here right now</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      {search ? "No tasks match your search. Try a different keyword." : activeView === "Today" ? "No tasks are scheduled for today. Enjoy the breathing room!" : "You're all caught up in this view. Add a task whenever you're ready."}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button onClick={openNewTaskForm} variant="primary"><Icon name="plus" size={17}/> Create task</Button>
                      <Button onClick={() => { setSearch(""); setFilterPriority("All"); navigate("My tasks"); }}>View my tasks</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span>{completedCount} completed · {activeCount} active · {overdueCount} overdue</span>
                <button onClick={() => navigate("Completed")} className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900">
                  Review completed tasks <Icon name="arrow" size={14}/>
                </button>
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Icon name="flag" size={20}/></span>
                  <div>
                    <h3 className="font-bold text-slate-900">Priority focus</h3>
                    <p className="text-xs text-slate-500">Keep the important work moving.</p>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900">{highPriorityCount}</div>
                    <p className="mt-1 text-sm text-slate-500">High-priority active tasks</p>
                  </div>
                  <Button onClick={() => { setFilterPriority("High"); navigate("My tasks"); setShowFilters(true); }}>
                    View high priority <Icon name="arrow" size={15}/>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="chart" size={20}/></span>
                  <div>
                    <h3 className="font-bold text-slate-900">Workspace summary</h3>
                    <p className="text-xs text-slate-500">Your progress across all projects.</p>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900">{projects.length}</div>
                    <p className="mt-1 text-sm text-slate-500">Active projects in your workspace</p>
                  </div>
                  <Button onClick={() => setShowProjectForm(true)}><Icon name="plus" size={16}/> Add project</Button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Backup and data</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">Your tasks and projects are saved in this browser. Export a backup regularly so you can restore your work later.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={exportTasks} variant="primary"><Icon name="download" size={17}/> Export backup</Button>
                <Button onClick={() => importRef.current?.click()}><Icon name="upload" size={17}/> Import backup</Button>
                <Button onClick={resetDemoData} variant="danger">Reset demo data</Button>
                <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={importTasks}/>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">Import replaces the current tasks and projects after confirmation. Export your current data first if you want to keep a copy.</p>
            </section>

            <footer className="py-8 text-center text-xs text-slate-400">
              Daymark Pro · Make today count.
            </footer>
          </div>
        </main>
      </div>

      {notice && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:right-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon name="check" size={17}/></span>
          <p className="text-sm font-medium text-slate-700">{notice}</p>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification" className="ml-2 text-slate-400 hover:text-slate-700"><Icon name="close" size={16}/></button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="task-form-title" className="my-auto w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="task-form-title" className="text-xl font-extrabold text-slate-900">{editingTaskId !== null ? "Edit task" : "Create a new task"}</h2>
                <p className="mt-1 text-sm text-slate-500">Make it clear, choose a priority, and set a deadline.</p>
              </div>
              <button onClick={() => setShowForm(false)} aria-label="Close task form" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><Icon name="close"/></button>
            </div>

            <form onSubmit={saveTask} className="space-y-5">
              <div>
                <label htmlFor="task-title" className="mb-2 block text-sm font-semibold text-slate-700">Task title</label>
                <input id="task-title" autoFocus maxLength={180} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs to get done?" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required/>
              </div>

              <div>
                <label htmlFor="task-project" className="mb-2 block text-sm font-semibold text-slate-700">Project</label>
                <select id="task-project" value={newTaskProject} onChange={(event) => setNewTaskProject(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required>
                  <option value="" disabled>Select a project</option>
                  {projects.map((project) => <option key={project.name} value={project.name}>{project.name}</option>)}
                </select>
                {!projects.length && <p className="mt-2 text-xs text-red-500">Create a project before adding a task.</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-due" className="mb-2 block text-sm font-semibold text-slate-700">Deadline</label>
                  <input id="task-due" type="date" value={newTaskDue} onChange={(event) => setNewTaskDue(event.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required/>
                </div>
                <div>
                  <label htmlFor="task-priority" className="mb-2 block text-sm font-semibold text-slate-700">Priority</label>
                  <select id="task-priority" value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button onClick={() => setShowForm(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" variant="primary" disabled={!projects.length} className="w-full sm:w-auto"><Icon name="check" size={17}/>{editingTaskId !== null ? "Save changes" : "Create task"}</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showProjectForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProjectForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="project-form-title" className="my-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="project-form-title" className="text-xl font-extrabold text-slate-900">Create a project</h2>
                <p className="mt-1 text-sm text-slate-500">Group related tasks together.</p>
              </div>
              <button onClick={() => setShowProjectForm(false)} aria-label="Close project form" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><Icon name="close"/></button>
            </div>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label htmlFor="project-name" className="mb-2 block text-sm font-semibold text-slate-700">Project name</label>
                <input id="project-name" autoFocus maxLength={70} value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="e.g. Mobile app development" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required/>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700">Project color</legend>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((color) => (
                    <button key={color} type="button" aria-label={`${color} project color`} aria-pressed={newProjectColor === color} onClick={() => setNewProjectColor(color)} className={`flex h-10 w-10 items-center justify-center rounded-xl ${color === "violet" ? "bg-violet-500" : color === "blue" ? "bg-sky-500" : color === "orange" ? "bg-orange-500" : color === "green" ? "bg-emerald-500" : "bg-pink-500"} ${newProjectColor === color ? "ring-4 ring-violet-200 ring-offset-2" : ""}`}>
                      {newProjectColor === color && <Icon name="check" size={19} className="text-white"/>}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button onClick={() => setShowProjectForm(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto"><Icon name="plus" size={17}/> Create project</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
