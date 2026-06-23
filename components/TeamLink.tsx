import Link from "next/link";

// Wraps its children in a link to the team page when a team id is present;
// otherwise renders them plainly (e.g. unresolved "Por definir" bracket slots).
// Use only in public views — it points at the public /equipo/[id] page.
export default function TeamLink({
  teamId,
  className,
  children,
}: {
  teamId: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  if (!teamId) return <span className={className}>{children}</span>;
  return (
    <Link href={`/equipo/${teamId}`} className={className}>
      {children}
    </Link>
  );
}
