interface LogDetailsProps {
  action: string;
  detailsStr: string | null;
}

export function LogDetails({ action, detailsStr }: LogDetailsProps) {
  if (!detailsStr) return <span className="text-muted-foreground text-xs">—</span>;

  let details: any = null;
  let isJsonValid = false;

  try {
    details = JSON.parse(detailsStr);
    isJsonValid = true;
  } catch {
    // If not JSON, we will render detailsStr directly
  }

  if (!isJsonValid) {
    return <span className="text-xs">{detailsStr}</span>;
  }

  if (typeof details === "string") {
    return <span className="text-xs">{details}</span>;
  }

  if (action === "CREATE_PROJECT" || action === "DELETE_PROJECT") {
    return (
      <span className="text-xs">
        Dự án: <strong className="font-semibold">{details.projectName || details.projectId}</strong>
      </span>
    );
  }

  if (action === "UPDATE_PROGRESS") {
    return (
      <div className="space-y-1 text-xs">
        <div>
          Dự án: <strong className="font-semibold">{details.projectName}</strong>
        </div>
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <span>Bước {details.oldStep}</span>
          <span>→</span>
          <span className="text-primary font-semibold">Bước {details.newStep}</span>
          {details.percentage !== undefined && (
            <span className="bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[10px] font-bold">
              {details.percentage}%
            </span>
          )}
        </div>
        {details.note && (
          <div className="text-muted-foreground max-w-md truncate text-[11px] italic">&quot;{details.note}&quot;</div>
        )}
      </div>
    );
  }

  if (action === "UPLOAD_FILE" || action === "DELETE_FILE") {
    return (
      <div className="space-y-1 text-xs">
        <div>
          Dự án: <strong className="font-semibold">{details.projectName || "Không rõ"}</strong>
        </div>
        <div className="text-muted-foreground text-[11px]">
          File:{" "}
          <span className="inline-block max-w-50 truncate align-bottom font-medium underline">{details.fileName}</span>
          {details.stepOrder && ` (Bước ${details.stepOrder})`}
        </div>
      </div>
    );
  }

  if (action === "CREATE_USER" || action === "UPDATE_USER" || action === "DELETE_USER") {
    return (
      <span className="text-xs">
        Tài khoản: <strong className="font-semibold">{details.targetName}</strong> (
        {details.targetEmail || details.targetRole})
      </span>
    );
  }

  return (
    <pre className="bg-muted/40 text-muted-foreground max-h-20 max-w-xs overflow-auto rounded p-1 font-mono text-[10px]">
      {JSON.stringify(details, null, 2)}
    </pre>
  );
}
