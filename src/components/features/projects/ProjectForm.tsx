"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/server/actions/project-actions";
import { createProjectSchema } from "@/lib/validations/project";
import { z } from "zod";

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: z.infer<typeof createProjectSchema> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      locale: formData.get("locale") as "es" | "en",
      status: "draft",
      demographicCategories: (formData.get("categories") as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const project = await createProject(data);
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium">Project Name</label>
        <input
          name="name"
          required
          className="w-full mt-1 p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          className="w-full mt-1 p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Locale</label>
        <select name="locale" className="w-full mt-1 p-2 border rounded">
          <option value="es">Spanish</option>
          <option value="en">English</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">
          Demographic Categories (comma separated)
        </label>
        <input
          name="categories"
          placeholder="department, role, location"
          className="w-full mt-1 p-2 border rounded"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
