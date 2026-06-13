import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Spinner className="size-8 text-primary" />
        </div>
    );
}
