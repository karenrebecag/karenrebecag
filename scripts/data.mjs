// GitHub is the only source. Nothing is read from the local machine.
const QUERY = `query($login:String!){
  user(login:$login){
    name login createdAt
    contributionsCollection{
      totalCommitContributions restrictedContributionsCount
      totalPullRequestContributions totalRepositoriesWithContributedCommits
      contributionCalendar{ totalContributions }
    }
    owned:repositories(ownerAffiliations:OWNER,isFork:false,first:1){ totalCount }
    stars:repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:STARGAZERS,direction:DESC}){
      nodes{ stargazerCount }
    }
    langSrc:repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:PUSHED_AT,direction:DESC}){
      nodes{ languages(first:10,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
    }
    recent:repositories(privacy:PUBLIC,ownerAffiliations:OWNER,isFork:false,first:8,orderBy:{field:PUSHED_AT,direction:DESC}){
      nodes{ name pushedAt defaultBranchRef{ name target{ ... on Commit { messageHeadline committedDate } } } }
    }
  }
}`;

async function graphql(token, login) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'karenrebecag-terminal-card',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${json.errors.map(e => e.message).join('; ')}`);
  if (!json.data?.user) throw new Error(`No such user: ${login}`);
  return json.data.user;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function relative(iso, now) {
  const days = Math.floor((now - new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

function topLanguages(nodes, count) {
  const bytes = new Map();
  for (const repo of nodes) {
    for (const { size, node } of repo.languages.edges) {
      bytes.set(node.name, (bytes.get(node.name) ?? 0) + size);
    }
  }
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, size]) => ({ name, pct: (100 * size) / total }));
}

export async function collect({ token, login, now = new Date(), langCount = 5, commitCount = 3 }) {
  const u = await graphql(token, login);
  const cc = u.contributionsCollection;
  const created = new Date(u.createdAt);

  const recent = u.recent.nodes
    .filter(r => r.defaultBranchRef?.target?.messageHeadline)
    .slice(0, commitCount)
    .map(r => ({
      repo: r.name,
      branch: r.defaultBranchRef.name,
      message: r.defaultBranchRef.target.messageHeadline,
      when: relative(r.defaultBranchRef.target.committedDate, now),
    }));

  return {
    name: u.name?.replace(/[^\p{L}\p{N}\s.'-]/gu, '').trim() || u.login,
    login: u.login,
    since: `${MONTHS[created.getUTCMonth()]} ${created.getUTCFullYear()}`,
    repos: u.owned.totalCount,
    stars: u.stars.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    commits: cc.totalCommitContributions,
    prs: cc.totalPullRequestContributions,
    contributedTo: cc.totalRepositoriesWithContributedCommits,
    contributions: cc.contributionCalendar.totalContributions,
    langs: topLanguages(u.langSrc.nodes, langCount),
    recent,
  };
}
