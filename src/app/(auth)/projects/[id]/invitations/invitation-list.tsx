"use client";

import { useState } from "react";
import { bulkCreateInvitations } from "@/server/actions/invitation-actions";

export function InvitationList({
  projectId,
  initialInvitations,
}: {
  projectId: string;
  initialInvitations: any[];
}) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loading, setLoading] = useState(false);

  async function onCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      try {
        await bulkCreateInvitations({ projectId, csvData });
        // In a real app we'd refresh the data properly via server components or a fresh fetch
        window.location.reload();
      } catch (err) {
        alert("Upload failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
        <div>
          <h3 className="font-medium">Bulk Upload</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV with an &apos;email&apos; column.
          </p>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={onCsvUpload}
          disabled={loading}
          className="text-sm"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Categories</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-2">{inv.email}</td>
                <td className="px-4 py-2">
                  <span className="capitalize">{inv.status}</span>
                </td>
                <td className="px-4 py-2">
                  {Object.entries(
                    (inv.categoryValues as Record<string, string>) || {},
                  ).map(([k, v]) => (
                    <span
                      key={k}
                      className="mr-2 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {invitations.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No invitations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
