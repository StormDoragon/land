import { MapExplorer } from "@/components/MapExplorer";
import { getSession } from "@/lib/auth";
import { getCountryScope } from "@/lib/geo";
import { focusForCountry } from "@/lib/countries";

export default async function MapPage() {
  const [session, scope] = await Promise.all([getSession(), getCountryScope()]);

  // Focus on the visitor's scope: their chosen country, the one auto-detected
  // from their IP, or the whole world when they've gone global.
  const focus = focusForCountry(scope.country?.code);

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <MapExplorer
        user={session ? { displayName: session.displayName } : null}
        variant="full"
        initialFocus={focus}
        focusLabel={scope.country ? scope.country.name : null}
      />
    </main>
  );
}
