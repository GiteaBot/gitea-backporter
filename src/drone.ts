const DRONE_API = "https://drone.gitea.io/api/repos/go-gitea/gitea";
const HEADERS = {
  Authorization: `Bearer ${Deno.env.get("BACKPORTER_DRONE_TOKEN")}`,
};

export const stopBuild = async (buildNumber: number): Promise<void> => {
  const response = await fetch(`${DRONE_API}/builds/${buildNumber}`, {
    method: "DELETE",
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to stop build ${buildNumber}: ${response.statusText}`,
    );
  }
};

// list builds
export const listBuilds = async (): Promise<[]> => {
  const response = await fetch(`${DRONE_API}/builds`, {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to list builds: ${response.statusText}`);
  }

  return await response.json();
};
