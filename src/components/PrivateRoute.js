import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ProgressSpinner } from "primereact/progressspinner";

const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
        <ProgressSpinner />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
