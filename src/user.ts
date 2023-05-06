import { fetchCurrentUser } from "./github.ts";

export let bot: { login: string; email: string };

export const init = async () => {
  bot = await fetchCurrentUser();
};
