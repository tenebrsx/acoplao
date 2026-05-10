export function formatDate(date: Date | { seconds: number }): string {
    const d = date instanceof Date ? date : new Date((date as any).seconds * 1000);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatRelativeTime(date: Date | { seconds: number }): string {
    const d = date instanceof Date ? date : new Date((date as any).seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(d);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        in_progress: "var(--status-progress)",
        review: "var(--status-review)",
        approved: "var(--status-approved)",
        completed: "var(--status-completed)",
        pending: "var(--status-pending)",
        revision_requested: "var(--status-revision)",
        resolved: "var(--status-approved)",
        low: "var(--priority-low)",
        medium: "var(--priority-medium)",
        high: "var(--priority-high)",
    };
    return colors[status] || "var(--text-tertiary)";
}

export function getStatusLabel(status: string): string {
    return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function classNames(...classes: (string | undefined | false)[]): string {
    return classes.filter(Boolean).join(" ");
}
