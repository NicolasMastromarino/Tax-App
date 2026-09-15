"use client";

import { useEffect } from "react";
import { injectContentsquareScript } from "@contentsquare/tag-sdk";

export function Contentsquare() {
  useEffect(() => {
    injectContentsquareScript({ clientId: "7ec6781d98c31" });
  }, []);
  return null;
}
