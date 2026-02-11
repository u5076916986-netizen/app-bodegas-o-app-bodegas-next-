import { notFound } from "next/navigation";
import QaClient from "./qa-client";

export default function QaPage() {
    if (process.env.NODE_ENV !== "development") {
        notFound();
    }

    return <QaClient />;
}