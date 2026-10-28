import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function registrationDate(user) {
  if (typeof user.createdAt?.toDate !== "function") return null;
  return user.createdAt.toDate();
}

function formatRegistrationDate(date) {
  return date
    ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "Date not recorded";
}

export default function AdminOverview() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const registeredUsers = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((user) => user.role === "farmer" || user.role === "resident")
        .sort((a, b) => {
          const dateA = registrationDate(a)?.getTime() || 0;
          const dateB = registrationDate(b)?.getTime() || 0;
          return dateB - dateA;
        });
      setUsers(registeredUsers);
      setError("");
      setLoading(false);
    },
    () => {
      setError("Unable to load registered users. Please check your connection and permissions.");
      setLoading(false);
    },
  ), []);

  const farmerCount = users.filter((user) => user.role === "farmer").length;
  const residentCount = users.filter((user) => user.role === "resident").length;

  return (
    <div className="admin-overview">
      <section className="registration-summary" aria-label="Registered user counts">
        <div className="registration-total">
          <span>Total Registered Users</span>
          <strong>{loading ? "—" : users.length}</strong>
        </div>
        <div className="registration-breakdown">
          <div>
            <span>Farmers</span>
            <strong>{loading ? "—" : farmerCount}</strong>
          </div>
          <div>
            <span>Residents</span>
            <strong>{loading ? "—" : residentCount}</strong>
          </div>
        </div>
      </section>

      <section className="activity-panel" id="manage-users" aria-labelledby="registration-log-title">
        <div className="activity-heading">
          <div>
            <p className="role-eyebrow">Admin</p>
            <h2 id="registration-log-title">Registration Activity Log</h2>
          </div>
          <span className="activity-count">{loading ? "Loading" : `${users.length} accounts`}</span>
        </div>
        {error ? (
          <p className="activity-message" role="alert">{error}</p>
        ) : loading ? (
          <p className="activity-message">Loading registrations...</p>
        ) : users.length ? (
          <ul className="activity-list">
            {users.map((registeredUser) => {
              const date = registrationDate(registeredUser);
              return (
                <li className="activity-item" key={registeredUser.id}>
                  <span className="activity-marker" aria-hidden="true" />
                  <div className="activity-details">
                    <strong>{registeredUser.name || registeredUser.email || "Unnamed account"}</strong>
                    <span>{registeredUser.email || "No email address"} · <span className="role-capitalize">{registeredUser.role}</span></span>
                  </div>
                  <time className="activity-date" dateTime={date?.toISOString()}>
                    {formatRegistrationDate(date)}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="activity-message">No registered users yet.</p>
        )}
      </section>
    </div>
  );
}
