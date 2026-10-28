import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { createManagedAccount, db } from "../firebase";

const PAGE_SIZE = 5;
const INITIAL_FORM = {
  name: "",
  purok: "",
  contactNumber: "",
  email: "",
  role: "farmer",
};
function createTemporaryPassword() {
  const randomValue = new Uint16Array(1);
  window.crypto.getRandomValues(randomValue);
  return `AMS@${String(randomValue[0] % 10000).padStart(4, "0")}`;
}

function getErrorMessage(error) {
  if (error.message?.startsWith("The profile could not be saved")) return error.message;
  if (error.code === "auth/email-already-in-use") return "An account already exists for this email.";
  if (error.code === "auth/invalid-email") return "Enter a valid email address.";
  if (error.code === "auth/weak-password") return "Unable to generate a valid temporary password. Please try again.";
  if (error.code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  if (error.code === "auth/operation-not-allowed") return "Email/password sign-in is disabled in Firebase Authentication.";
  if (error.code === "auth/too-many-requests") return "Too many account creation attempts. Please try again later.";
  return "Unable to add this user. Please check Firebase permissions and try again.";
}

function formatDate(timestamp) {
  if (typeof timestamp?.toDate !== "function") return "—";
  return timestamp.toDate().toLocaleDateString([], { dateStyle: "medium" });
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      setUsers(snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((user) => user.role === "farmer" || user.role === "resident"));
      setLoading(false);
      setLoadError("");
    },
    () => {
      setLoading(false);
      setLoadError("Unable to load users. Check Firebase permissions and try again.");
    },
  ), []);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const filtered = users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch = !term || String(user.name || "").toLocaleLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
    return filtered.sort((a, b) => {
      const left = a[sort.field];
      const right = b[sort.field];
      const comparison = sort.field === "createdAt"
        ? (left?.toMillis?.() || 0) - (right?.toMillis?.() || 0)
        : String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
      return comparison * (sort.direction === "asc" ? 1 : -1);
    });
  }, [users, roleFilter, search, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const pageUsers = visibleUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    if (!showForm) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !saving) setShowForm(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showForm, saving]);

  const changeFilter = (filter) => {
    setRoleFilter(filter);
    setPage(1);
  };

  const changeSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const changeForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const addUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setCreatedCredentials(null);
    setCopyMessage("");

    const temporaryPassword = createTemporaryPassword();
    try {
      await createManagedAccount(form.email.trim(), temporaryPassword, {
        name: form.name.trim(),
        purok: form.purok.trim(),
        barangay: "Bañadero",
        city: "Legazpi",
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim(),
        role: form.role,
        createdAt: serverTimestamp(),
      });
      setCreatedCredentials({ email: form.email.trim(), password: temporaryPassword });
      setCopyMessage("");
      setForm(INITIAL_FORM);
      setShowForm(false);
      setPage(1);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const copyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(createdCredentials.password);
      setCopyMessage("Temporary password copied.");
    } catch {
      setCopyMessage("Copy was unavailable. Select the password and copy it manually.");
    }
  };

  const sortLabel = (label, field) => (
    <button className="table-sort" type="button" onClick={() => changeSort(field)}>
      {label}{sort.field === field ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <section className="manage-users-page" id="manage-users">
      <header className="manage-users-heading">
        <div>
          <p className="role-eyebrow">Admin workspace</p>
          <h1>Manage Users</h1>
          <p>Register and organize farmer and resident accounts.</p>
        </div>
        <button
          className="add-user-button"
          type="button"
          onClick={() => {
            setShowForm((open) => !open);
            setFormError("");
            setCreatedCredentials(null);
          }}
        >
          <span aria-hidden="true">＋</span> Add User
        </button>
      </header>

      {createdCredentials && (
        <section className="temporary-password-notice" aria-live="polite">
          <div>
            <strong>User account created</strong>
            <p>Share this temporary password with the user securely. It will only be shown here once.</p>
            <p><b>Email:</b> {createdCredentials.email}</p>
            <p><b>Temporary password:</b> <code className="temporary-password">{createdCredentials.password}</code></p>
            <button type="button" className="copy-password-button" onClick={copyTemporaryPassword}>Copy password</button>
            {copyMessage && <p className="copy-password-message" role="status">{copyMessage}</p>}
          </div>
          <button type="button" className="notice-dismiss" onClick={() => setCreatedCredentials(null)} aria-label="Dismiss credentials">×</button>
        </section>
      )}

      {showForm && (
        <div
          className="user-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setShowForm(false);
          }}
        >
        <form className="user-form-panel user-modal" onSubmit={addUser} role="dialog" aria-modal="true" aria-labelledby="add-user-title">
          <div className="user-form-heading">
            <div>
              <p className="role-eyebrow">New account</p>
              <h2 id="add-user-title">Add User</h2>
            </div>
            <button type="button" className="form-close" onClick={() => setShowForm(false)} disabled={saving} aria-label="Close form">×</button>
          </div>
          <div className="user-form-grid">
            <label>
              Full Name
              <input autoComplete="name" value={form.name} onChange={changeForm("name")} required />
            </label>
            <label>
              Purok
              <input value={form.purok} onChange={changeForm("purok")} required />
            </label>
            <label>
              Barangay
              <input value="Bañadero" readOnly />
            </label>
            <label>
              City
              <input value="Legazpi" readOnly />
            </label>
            <label>
              Contact Number
              <input type="tel" autoComplete="tel" value={form.contactNumber} onChange={changeForm("contactNumber")} required />
            </label>
            <label>
              Email
              <input type="email" autoComplete="email" value={form.email} onChange={changeForm("email")} required />
            </label>
            <label>
              Role
              <select value={form.role} onChange={changeForm("role")}>
                <option value="farmer">Farmer</option>
                <option value="resident">Resident</option>
              </select>
            </label>
          </div>
          {formError && <p className="user-form-error" role="alert">{formError}</p>}
          <div className="user-form-actions">
            <button type="button" className="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? "Creating account..." : "Create account"}</button>
          </div>
        </form>
        </div>
      )}

      <section className="users-table-panel">
        <div className="users-table-toolbar">
          <div>
            <h2>Registered Users</h2>
            <p>{visibleUsers.length} {roleFilter === "all" ? "users" : `${roleFilter}s`}</p>
          </div>
          <label className="user-search">
            <span className="sr-only">Search users</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="user-role-filters" aria-label="Filter users by role">
            {[
              ["all", "All users"],
              ["farmer", "Farmers"],
              ["resident", "Residents"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={roleFilter === value ? "selected" : ""}
                aria-pressed={roleFilter === value}
                onClick={() => changeFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <p className="users-table-message" role="alert">{loadError}</p>
        ) : loading ? (
          <p className="users-table-message">Loading users...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="managed-users-table">
                <thead>
                  <tr>
                    <th>{sortLabel("Full Name", "name")}</th>
                    <th>{sortLabel("Role", "role")}</th>
                    <th>{sortLabel("Purok", "purok")}</th>
                    <th>Barangay</th>
                    <th>City</th>
                    <th>{sortLabel("Contact Number", "contactNumber")}</th>
                    <th>{sortLabel("Email", "email")}</th>
                    <th>{sortLabel("Registered", "createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || "—"}</td>
                      <td><span className={`user-role-badge ${user.role}`}>{user.role}</span></td>
                      <td>{user.purok || "—"}</td>
                      <td>{user.barangay || "—"}</td>
                      <td>{user.city || "—"}</td>
                      <td>{user.contactNumber || "—"}</td>
                      <td>{user.email || "—"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                  {!pageUsers.length && <tr><td className="users-empty" colSpan={8}>No users found for this filter.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="users-pagination">
              <span>
                {visibleUsers.length
                  ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visibleUsers.length)} of ${visibleUsers.length}`
                  : "No users"}
              </span>
              <div>
                <button type="button" className="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <span>Page {page} of {pageCount}</span>
                <button type="button" className="secondary" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
