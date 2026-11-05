export function Footer({ className = 'mt-12' }: { className?: string }) {
  // Set by code at render time, never typed by hand.
  const year = new Date().getFullYear();
  return (
    <footer className={`border-rule text-muted border-t pt-6 pb-8 text-sm ${className}`}>
      <p className="max-w-3xl">
        Practice project. Statlume is a fictional brand created to show my development skills. It is
        not a real business and is not linked to any client work.
      </p>
      <p className="mt-2">
        © <span className="num">{year}</span> Statlume. Store data is generated for the fictional
        shop Halden Goods.
      </p>
    </footer>
  );
}
