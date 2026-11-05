import { useState } from "react";
import { api } from "./api.js";

export default function AuthPage({ onAuthenticated }) {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const credentials = { email: email.trim(), password };
      if (registering) await api.register({ ...credentials, name: name.trim() });
      else await api.login(credentials);
      const session = await api.me();
      const preferredWorkspace = session.workspaces.find(
        (workspace) => workspace.id === api.getWorkspaceId(),
      ) || session.workspaces[0];
      api.setWorkspaceId(preferredWorkspace?.id);
      onAuthenticated({
        ...session,
        activeWorkspaceId: preferredWorkspace?.id || "",
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Daymark</h1>
            <p className="text-xs font-medium text-slate-400">PRO TASK MANAGER</p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900">
          {registering ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {registering
            ? "Start a private workspace for your projects and tasks."
            : "Sign in to open your projects and tasks."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          {registering && (
            <div>
              <label htmlFor="account-name" className="mb-2 block text-sm font-semibold text-slate-700">Your name</label>
              <input
                id="account-name"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="account-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              required
            />
          </div>
          <div>
            <label htmlFor="account-password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="account-password"
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              required
            />
            {registering && <p className="mt-2 text-xs text-slate-400">Use at least 12 characters.</p>}
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Please wait..." : registering ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {registering ? "Already have an account?" : "New to Daymark?"}{" "}
          <button
            type="button"
            onClick={() => { setError(""); setRegistering((value) => !value); }}
            className="font-semibold text-violet-700 hover:text-violet-900"
          >
            {registering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
