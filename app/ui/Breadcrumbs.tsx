import Link from "next/link";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <ol className="flex flex-wrap items-center gap-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <Link href={item.href} className="font-medium text-slate-700 hover:text-slate-900 hover:underline">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={isLast ? "font-semibold text-slate-900" : "text-slate-600"}>
                                    {item.label}
                                </span>
                            )}
                            {!isLast ? <span className="text-slate-400">/</span> : null}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
