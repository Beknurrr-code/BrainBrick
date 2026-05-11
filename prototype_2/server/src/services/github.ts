// GitHub Search service for BrainBricks Marketplace
// Allows finding MCP tools and robot builds shared on GitHub

export interface GitHubItem {
  id: string;
  name: string;
  author: string;
  description: string;
  stars: number;
  url: string;
  type: 'build' | 'prompt' | 'mcp';
}

export async function searchGitHub(query: string): Promise<GitHubItem[]> {
  try {
    // We search for repositories with specific topics like 'brainbricks-tool' or 'brainbricks-build'
    // For the hackathon, we simulate this by searching generally or returning high-quality mocks
    // if GitHub API is rate limited.
    
    // Real GitHub API call:
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query + ' topic:brainbricks')}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BrainBricks-App'
        }
      }
    );

    if (!response.ok) {
      console.warn("[GitHub] API error, using fallsback results");
      return getFallbackResults(query);
    }

    const data = await response.json();
    return (data.items || []).map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
      author: repo.owner.login,
      description: repo.description || "No description provided",
      stars: repo.stargazers_count,
      url: repo.html_url,
      type: repo.name.toLowerCase().includes('mcp') ? 'mcp' : 
            repo.name.toLowerCase().includes('build') ? 'build' : 'prompt'
    }));
  } catch (e) {
    console.error("[GitHub] Search failed:", e);
    return getFallbackResults(query);
  }
}

function getFallbackResults(query: string): GitHubItem[] {
  // Demo results for the hackathon
  const allResults: GitHubItem[] = [
    {
      id: "gh1",
      name: "advanced-navigation-mcp",
      author: "LegoMaster42",
      description: "Advanced SLAM-like navigation logic for BrainBricks Rover.",
      stars: 128,
      url: "https://github.com/example/advanced-navigation",
      type: "mcp"
    },
    {
      id: "gh2",
      name: "emotion-response-pack",
      author: "AI-Enthusiast",
      description: "A set of prompts to make your robot respond emotionally to face detection.",
      stars: 85,
      url: "https://github.com/example/emotion-pack",
      type: "prompt"
    },
    {
      id: "gh3",
      name: "hexapod-spider-build",
      author: "RobotMechanic",
      description: "3D instructions and logic for a 6-legged LEGO 51515 spider.",
      stars: 312,
      url: "https://github.com/example/spider-build",
      type: "build"
    }
  ];

  if (!query) return allResults;
  return allResults.filter(i => 
    i.name.toLowerCase().includes(query.toLowerCase()) || 
    i.description.toLowerCase().includes(query.toLowerCase())
  );
}
