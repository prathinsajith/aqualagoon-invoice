import { redirect } from "next/navigation";

/** Role management now lives under Settings. */
export default function RolesPage() {
  redirect("/settings");
}
