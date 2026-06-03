import { gitConfig } from '@/lib/layout.shared';

export const githubRepoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export function getArticleFeedbackIssueUrl({ url, title }: { url: string; title: string }) {
  const issueBody = [
    `Page: ${url}`,
    `Chapter: ${title}`,
    '',
    'What should be improved?',
    '',
    '',
    'Suggested correction:',
    '',
  ].join('\n');

  const params = new URLSearchParams({
    title: `Feedback: ${title}`,
    body: issueBody,
    labels: 'feedback',
  });

  return `${githubRepoUrl}/issues/new?${params.toString()}`;
}
