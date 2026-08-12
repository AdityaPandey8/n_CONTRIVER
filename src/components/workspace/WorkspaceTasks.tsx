import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Calendar } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface Props {
  tasks: any[];
  createTask: UseMutationResult<void, Error, { title: string; description?: string; priority?: string; due_date?: string }>;
  updateTask: UseMutationResult<void, Error, { id: string; [key: string]: any }>;
  deleteTask: UseMutationResult<void, Error, string>;
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-green-500/10 text-green-600 border-green-500/20",
};

export function WorkspaceTasks({ tasks, createTask, updateTask, deleteTask }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createTask.mutate({ title: newTitle.trim(), priority: newPriority });
    setNewTitle("");
  };

  const toggleDone = (task: any) => {
    updateTask.mutate({ id: task.id, status: task.status === "done" ? "todo" : "done" });
  };

  const todoTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="space-y-6">
      {/* Add Task */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="bg-background flex-1"
            />
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">To Do ({todoTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todoTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above!</p>
          ) : (
            todoTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggleDone(task)}
                />
                <span className="flex-1 text-sm">{task.title}</span>
                <Badge variant="outline" className={priorityColors[task.priority] || ""}>
                  {task.priority}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTask.mutate(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {doneTasks.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Completed ({doneTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-60">
                <Checkbox
                  checked={true}
                  onCheckedChange={() => toggleDone(task)}
                />
                <span className="flex-1 text-sm line-through">{task.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteTask.mutate(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
