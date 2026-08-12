import { Check, FolderKanban, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useActiveWorkspace } from "@/contexts/ActiveWorkspaceContext";
import { cn } from "@/lib/utils";

export function WorkspaceContextPicker({ className }: { className?: string }) {
  const { activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, workspaces } = useActiveWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5 h-8 rounded-full text-xs font-medium", className)}
        >
          {activeWorkspace ? (
            <>
              <FolderKanban className="h-3.5 w-3.5 text-emerald-500" />
              <span className="truncate max-w-[160px]">{activeWorkspace.idea_name}</span>
            </>
          ) : (
            <>
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span>General mode</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">AI workspace context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setActiveWorkspaceId(null)} className="text-sm">
          <Globe className="h-3.5 w-3.5 mr-2" />
          <span className="flex-1">General mode</span>
          {!activeWorkspaceId && <Check className="h-3.5 w-3.5" />}
        </DropdownMenuItem>
        {workspaces.length > 0 && <DropdownMenuSeparator />}
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => setActiveWorkspaceId(w.id)}
            className="text-sm"
          >
            <FolderKanban className="h-3.5 w-3.5 mr-2 text-emerald-500" />
            <span className="flex-1 truncate">{w.idea_name}</span>
            {activeWorkspaceId === w.id && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
        {workspaces.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No workspaces yet. Create one from My Ideas.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}