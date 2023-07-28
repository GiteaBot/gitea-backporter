import { addComment, fetchPrFileNames } from "./github.ts";

export const commentIfTranslationsChanged = async (
  pr: { number: number; user: { login: string } },
) => {
  const prFileNamesSet = await fetchPrFileNames(pr.number);
  const prFileNames = Array.from(prFileNamesSet);
  const translationsChanged = prFileNames.some((fileName) =>
    fileName.startsWith("options/locale/") && fileName.endsWith(".ini") &&
    !fileName.endsWith("en-US.ini")
  );
  if (translationsChanged) {
    const comment =
      `@${pr.user.login} I noticed you've updated the locales for non-English languages. These will be overwritten during the sync from our translation tool Crowdin. If you'd like to contribute your translations, please visit https://crowdin.com/project/gitea. Please revert the changes done on these files. :tea:`;
    await addComment(pr.number, comment);
  }
};
