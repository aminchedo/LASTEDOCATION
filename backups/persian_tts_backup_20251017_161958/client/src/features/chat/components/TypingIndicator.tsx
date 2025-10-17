
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2" role="status" aria-label="در حال تایپ">
      <div
        className="w-2 h-2 rounded-full bg-[color:var(--c-primary)] animate-typing"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-2 h-2 rounded-full bg-[color:var(--c-primary)] animate-typing"
        style={{ animationDelay: '200ms' }}
      />
      <div
        className="w-2 h-2 rounded-full bg-[color:var(--c-primary)] animate-typing"
        style={{ animationDelay: '400ms' }}
      />
    </div>
  );
}

