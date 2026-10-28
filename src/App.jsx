import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ADMIN_UID, auth, db } from "./firebase";
import Login from "./components/Login.jsx";
import RoleDashboard from "./components/RoleDashboard.jsx";
import SplashScreen from "./components/SplashScreen.jsx";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState(undefined);
  const [roleError, setRoleError] = useState("");

  useEffect(
    () => onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) setShowSplash(false);
    }),
    [],
  );

  useEffect(() => {
    if (!user || user.uid === ADMIN_UID) {
      setRole(undefined);
      setRoleError("");
      return;
    }

    let active = true;
    setRole(undefined);
    setRoleError("");

    getDoc(doc(db, "users", user.uid))
      .then((profile) => {
        if (!active) return;
        if (!profile.exists()) {
          setRoleError("Your account profile was not found. Please contact the administrator.");
          return;
        }

        const accountRole = profile.data().role;
        if (accountRole !== "resident" && accountRole !== "farmer") {
          setRoleError("Your account does not have a valid role. Please contact the administrator.");
          return;
        }
        setRole(accountRole);
      })
      .catch(() => {
        if (active) setRoleError("Unable to load your account profile. Please try again later.");
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  if (user === undefined) return <div className="center">Loading...</div>;
  if (!user) return <Login />;
  if (user.uid === ADMIN_UID) return <RoleDashboard user={user} role="admin" />;
  if (roleError) {
    return (
      <div className="center role-error">
        <div>
          <p>{roleError}</p>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>
    );
  }
  if (!role) return <div className="center">Loading your account...</div>;
  return <RoleDashboard user={user} role={role} />;
}
