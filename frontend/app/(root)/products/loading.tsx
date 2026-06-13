import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="size-8" />
    </div>
  );
}
