export default function UserAvatar({ name }: { name: string }) {
  const initial = (name?.trim()?.[0] || "?").toUpperCase();
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white text-sm font-semibold">
      {initial}
    </div>
  );
}
