import { cookies } from "next/headers";

export async function getProjectId(): Promise<string> {
  const jar = await cookies();
  return jar.get("ob_project")?.value ?? process.env.DEFAULT_PROJECT_ID ?? "demo";
}
