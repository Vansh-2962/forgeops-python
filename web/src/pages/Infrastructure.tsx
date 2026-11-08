import { PageHeader } from "@/components/shared/PageHeader";
import { InfrastructureHealth } from "@/components/dashboard/InfrastructureHealth";
import { infrastructure } from "@/data/mockData";

export default function Infrastructure() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Infrastructure"
        description="Health of services across all environments."
      />
      <div className="mt-5 rounded-lg border border-border bg-card p-5">
        <InfrastructureHealth environments={infrastructure} />
      </div>
    </div>
  );
}
