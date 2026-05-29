import { redirect } from "next/navigation";

export default function QueuePage() {
  redirect("/donations/ledger?view=needs_attention");
}
