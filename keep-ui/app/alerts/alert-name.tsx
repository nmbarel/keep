import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  Cog8ToothIcon,
  TicketIcon,
  TrashIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { Icon } from "@tremor/react";
import { AlertDto, AlertKnownKeys } from "./models";
import { Workflow } from "app/workflows/models";
import { useRouter } from "next/navigation";
import { useWorkflows } from "utils/hooks/useWorkflows";
import { useMemo } from "react";

const getExtraPayloadNoKnownKeys = (alert: AlertDto) =>
  Object.fromEntries(
    Object.entries(alert).filter(([key]) => !AlertKnownKeys.includes(key))
  );

const getRelevantWorkflows = (alert: AlertDto, workflows: Workflow[]) => {
  const extraPayloadNoKnownKeys = getExtraPayloadNoKnownKeys(alert);

  return workflows.filter((workflow) => {
    const alertTrigger = workflow.triggers.find(
      (trigger) => trigger.type === "alert"
    );

    const workflowIsRelevant = alertTrigger?.filters?.every((filter) => {
      if (filter.key === "source") {
        return alert.source?.includes(filter.value);
      }
      return (
        (alert as any)[filter.key] === filter.value ||
        extraPayloadNoKnownKeys[filter.key] === filter.value
      );
    });
    return workflowIsRelevant;
  });
};

interface Props {
  alert: AlertDto;
  setNoteModalAlert?: (alert: AlertDto) => void;
  setTicketModalAlert?: (alert: AlertDto) => void;
}
export default function AlertName({ alert, setNoteModalAlert, setTicketModalAlert}: Props) {
  const router = useRouter();
  const { data: workflows = [] } = useWorkflows();

  const handleNoteClick = () => {
    if(setNoteModalAlert)
    {
      setNoteModalAlert(alert);
    }
  };

  const handleTicketClick = () => {
    if (!ticketUrl && setTicketModalAlert) {
      setTicketModalAlert(alert);
    } else {
      window.open(ticketUrl, '_blank'); // Open the ticket URL in a new tab
    }
  };

  const {
    name,
    url,
    generatorURL,
    deleted,
    lastReceived,
    note,
    ticket_url: ticketUrl,
    ticket_status: ticketStatus,
    playbook_url,
  } = alert;

  const handleWorkflowClick = (workflows: Workflow[]) => {
    if (workflows.length === 1) {
      return router.push(`workflows/${workflows[0].id}`);
    }

    return router.push("workflows");
  };

  const relevantWorkflows = useMemo(
    () => getRelevantWorkflows(alert, workflows),
    [alert, workflows]
  );




  return (
      <div className="max-w-[340px]">
        <div className="flex items-center justify-between">
          <div className="truncate" title={alert.name}>
            {name}{" "}
          </div>
          <div>
            {(url ?? generatorURL) && (
              <a href={url || generatorURL} target="_blank">
                <Icon
                  icon={ArrowTopRightOnSquareIcon}
                  tooltip="Open Original Alert"
                  color="gray"
                  variant="solid"
                  size="xs"
                  className="ml-1"
                />
              </a>
            )}
            { setTicketModalAlert && (
                <Icon
                icon={TicketIcon}
                tooltip={ticketUrl ? `Ticket Assigned ${ticketStatus ? `(status: ${ticketStatus})` : ''}` : "Click to assign Ticket"}
                size="xs"
                color={ticketUrl ? "green" : "gray"}
                className="ml-1 cursor-pointer"
                variant="solid"
                onClick={handleTicketClick}
              />
            )}

            {playbook_url && (
              <a href={playbook_url} target="_blank">
                <Icon
                  icon={BookOpenIcon}
                  tooltip="Playbook"
                  size="xs"
                  color="gray"
                  className="ml-1"
                  variant="solid"
                />
              </a>
            )}
            {
              setNoteModalAlert && (
                <Icon
                icon={PencilSquareIcon}
                tooltip="Click to add note"
                size="xs"
                color={note ? "green" : "gray"}
                className="ml-1 cursor-pointer"
                variant="solid"
                onClick={handleNoteClick}
              />
            )}

            {deleted && (
              <Icon
                icon={TrashIcon}
                tooltip="This alert has been deleted"
                size="xs"
                color="gray"
                className="ml-1"
                variant="solid"
              />
            )}
            {relevantWorkflows.length > 0 && (
              <Icon
                icon={Cog8ToothIcon}
                size="xs"
                color={`${
                  relevantWorkflows.every(
                    (wf) => wf.last_execution_status === "success"
                  )
                    ? "green"
                    : relevantWorkflows.some(
                        (wf) => wf.last_execution_status === "error"
                      )
                    ? "red"
                    : relevantWorkflows.some(
                        (wf) =>
                          wf.last_execution_status === "providers_not_configured"
                      )
                    ? "amber"
                    : "gray"
                }`}
                tooltip={`${
                  relevantWorkflows.every(
                    (wf) => wf.last_execution_status === "success"
                  )
                    ? "All workflows executed successfully"
                    : relevantWorkflows.some(
                        (wf) => wf.last_execution_status === "error"
                      )
                    ? "Some workflows failed to execute"
                    : relevantWorkflows.some(
                        (wf) =>
                          wf.last_execution_status === "providers_not_configured"
                      )
                    ? "Some workflows are not configured"
                    : "Workflows have yet to execute"
                }`}
                onClick={() => handleWorkflowClick(relevantWorkflows)}
                className="ml-1 cursor-pointer"
                variant="solid"
              />
            )}
          </div>
        </div>
      </div>
  );
}
