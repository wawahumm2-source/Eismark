"use client";

import { useEffect } from "react";

export default function AppScript() {
  useEffect(() => {
    import("/app.js");
  }, []);

  return null;
}
