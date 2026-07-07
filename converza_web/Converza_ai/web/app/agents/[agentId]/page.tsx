import AgentChatPage from "@/components/switchboard/AgentChatPage";
import type { SwitchboardAgentId } from "@/lib/converza-api";

const AGENTS = ["milo", "sleyz", "vea"] as const;

export function generateStaticParams() {
  return AGENTS.map((agentId) => ({ agentId }));
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  if (!AGENTS.includes(agentId as SwitchboardAgentId)) {
    return null;
  }
  return <AgentChatPage agentId={agentId as SwitchboardAgentId} />;
}
