import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewAgentTaskDialog } from "@/components/agent/NewAgentTaskDialog";
import AgentRunLists from "@/components/agent/AgentRunLists";

export default function AgentRuns() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Agent Runs"
        description="Autonomous tasks executed by your AI DevOps engineer."
        actions={
          <>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Agent Task
            </Button>
          </>
        }
      />

      <AgentRunLists />

      <NewAgentTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}


