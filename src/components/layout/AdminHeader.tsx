export default function AdminHeader({ title, eventName }: { title: string; eventName?: string }) {
  return (
    <header className="flex justify-between items-center w-full px-margin-desktop h-16 bg-surface-container-lowest border-b border-outline-variant shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
        {eventName && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-outline-variant">
            <span className="material-symbols-outlined text-secondary text-sm">event</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">{eventName}</span>
          </div>
        )}
      </div>
    </header>
  );
}
