/*
framework by me, finished by Claude
return Promise resolved as flatten list,
which element is a full url for special file

CNAME and README.md are excluded.

Example result (a list containing the license file):
  [
    "https://afw.lang-core.org/LICENSE"
  ]
*/
function main() {
  const root = `afw.lang-core.org`;
  const owner = "lang-core-org";
  const repo = "framework-for-agent";

  const excluded = new Set(["CNAME", "README.md"]);

  return fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github+json"
      }
    }
  ).then(
    (res) => {
      if (res.ok === true) {
        return res.json();
      } else {
        throw new Error(`GitHub API request failed: ${res.status}`);
      }
    }
  ).then(
    (data) => {
      if (data.truncated === true) {
        throw new Error("The file tree was truncated by GitHub API");
      } else {
        return data.tree.filter(
            (i) => i.type === "blob" && 
                   excluded.has(i.path) === false
          ).map(
            (i) =>
              `https://${root}/` +
              i.path.split("/").map(encodeURIComponent).join("/")
          );
      }
    }
  );
}
