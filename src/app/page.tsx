import { MapExplorer } from "@/components/MapExplorer";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  return (
    <main className="flex-1 flex flex-col min-h-0">
      <MapExplorer
        user={session ? { displayName: session.displayName } : null}
      />
    </main>
  );
}
