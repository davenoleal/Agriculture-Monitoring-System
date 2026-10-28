import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, ADMIN_UID } from "./firebase";

const STATUSES = ["Planted", "Growing", "Flowering", "Ready to Harvest", "Harvested"];

function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name,
          email,
          role: "farmer",
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>🌾 Agriculture Monitoring</h1>
        <h2>{mode === "login" ? "Login" : "Farmer Registration"}</h2>
        {mode === "register" && (
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Password (min 6)"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{mode === "login" ? "Login" : "Register"}</button>
        <p className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "No account? Register as farmer" : "Have an account? Login"}
        </p>
      </form>
    </div>
  );
}

const emptyForm = { name: "", area: "", plantedOn: "", status: STATUSES[0], notes: "" };

function Dashboard({ user }) {
  const isAdmin = user.uid === ADMIN_UID;
  const [crops, setCrops] = useState([]);
  const [users, setUsers] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = isAdmin ? collection(db, "crops") : query(collection(db, "crops"), where("ownerUid", "==", user.uid));
    return onSnapshot(q, (snap) => setCrops(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isAdmin, user.uid]);

  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(collection(db, "users"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data()));
      setUsers(map);
    });
  }, [isAdmin]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const data = { ...form, area: Number(form.area) };
    if (editId) {
      await updateDoc(doc(db, "crops", editId), data);
    } else {
      await addDoc(collection(db, "crops"), {
        ...data,
        ownerUid: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });
    }
    setForm(emptyForm);
    setEditId(null);
  };

  const edit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, area: c.area, plantedOn: c.plantedOn, status: c.status, notes: c.notes || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id) => confirm("Delete this record?") && deleteDoc(doc(db, "crops", id));

  const shown = crops
    .filter((c) => (c.name + (c.ownerName || "")).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.plantedOn || "").localeCompare(a.plantedOn || ""));

  const totalArea = crops.reduce((s, c) => s + (c.area || 0), 0);
  const ready = crops.filter((c) => c.status === "Ready to Harvest").length;
  const farmerCount = Object.values(users).filter((u) => u.role === "farmer").length;

  return (
    <div className="container">
      <header>
        <h1>🌾 Agriculture Monitoring System</h1>
        <div>
          <span className="badge">{isAdmin ? "Admin" : "Farmer"}</span> {user.displayName || user.email}{" "}
          <button className="secondary" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </header>

      <div className="stats">
        <div className="card"><b>{crops.length}</b><span>Crop Records</span></div>
        <div className="card"><b>{totalArea.toFixed(2)}</b><span>Total Area (ha)</span></div>
        <div className="card"><b>{ready}</b><span>Ready to Harvest</span></div>
        {isAdmin && <div className="card"><b>{farmerCount}</b><span>Registered Farmers</span></div>}
      </div>

      <form className="card form" onSubmit={save}>
        <h2>{editId ? "Edit Crop" : "Add Crop"}</h2>
        <input placeholder="Crop name (e.g. Rice)" value={form.name} onChange={set("name")} required />
        <input type="number" step="0.01" min="0" placeholder="Area (hectares)" value={form.area} onChange={set("area")} required />
        <input type="date" value={form.plantedOn} onChange={set("plantedOn")} required />
        <select value={form.status} onChange={set("status")}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="Notes" value={form.notes} onChange={set("notes")} />
        <div>
          <button>{editId ? "Update" : "Add"}</button>{" "}
          {editId && (
            <button type="button" className="secondary" onClick={() => { setEditId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h2>{isAdmin ? "All Crop Records" : "My Crop Records"}</h2>
        <input className="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Farmer</th>}
                <th>Crop</th><th>Area (ha)</th><th>Planted</th><th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  {isAdmin && <td>{c.ownerName || users[c.ownerUid]?.name || c.ownerUid}</td>}
                  <td>{c.name}</td><td>{c.area}</td><td>{c.plantedOn}</td>
                  <td><span className="pill">{c.status}</span></td><td>{c.notes}</td>
                  <td>
                    <button className="secondary" onClick={() => edit(c)}>Edit</button>{" "}
                    <button className="danger" onClick={() => remove(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={7}>No records.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h2>Farmers</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Crops</th></tr></thead>
              <tbody>
                {Object.entries(users).filter(([, u]) => u.role === "farmer").map(([uid, u]) => (
                  <tr key={uid}>
                    <td>{u.name}</td><td>{u.email}</td>
                    <td>{crops.filter((c) => c.ownerUid === uid).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <div className="center">Loading...</div>;
  return user ? <Dashboard user={user} /> : <Login />;
}
