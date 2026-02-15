"use client";

import { useState } from "react";
import {
  addCollaborator,
  removeCollaborator,
} from "@/server/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CollaboratorManager({
  projectId,
  collaborators,
}: {
  projectId: string;
  collaborators: any[];
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await addCollaborator(projectId, email);
      setEmail("");
      router.refresh();
    } catch (err: any) {
      setError(
        err.message === "USER_NOT_FOUND"
          ? "User not found"
          : "Failed to add collaborator",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(userId: string) {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await removeCollaborator(projectId, userId);
      router.refresh();
    } catch (err) {
      alert("Failed to remove collaborator");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Collaborator
        </h3>
        <form onSubmit={onAdd} className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !email}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Collaborators</h3>
        <div className="divide-y">
          {collaborators.map((c) => (
            <div key={c.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">
                  {c.displayName || "No name"}
                </p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(c.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {collaborators.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground italic">
              No collaborators added yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
