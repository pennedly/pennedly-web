"use client";

// The standalone Posts screen has been folded into "My Feed" (/app/feed),
// which now shows the same posts with analytics AND the delete action.
// Kept as a redirect so old links / bookmarks still land somewhere sane.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/feed");
  }, [router]);
  return null;
}
