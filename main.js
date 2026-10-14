/*
THIS FILE framework by me, finished by Claude
THIS REPO LICENSE at https://afw.lang-core.org/LICENSE
*/

/*
GAT  represent `GitHub REST "Get a tree"` in following

return Promise resolved as flatten list,
which element is a full url for first-level entry of the repo
(folder or file, as shown on the repo home page, not recursive), like:

https://afw.lang-core.org/<name>?type=<type>&note=<note>&depend=<depend>&hash=<hash>

<name>
     file name or package name, depends on <type>
<type> 
     `package`   GAT returns type === "tree" , for local
     `file`      GAT returns type === "blob", usually for linked in webpage
<note>
     content in () of <name>,
     which usually used as description,
     maybe empty
<depend>
     content in [] of <name>,
     which is <name> split by ` `,
     maybe empty
<hash>
     hash for afw.lang-core.org/<name> represented files
     definition of <hash>: value of `sha` in GAT returns

.nojekyll, CNAME, README.md and LICENSE are excluded.
*/
function main() {
  const root = `afw.lang-core.org`;
  const owner = "lang-core-org";
  const repo = "framework-for-agent";

  const excluded = new Set(
    [
      ".nojekyll",
      "CNAME",
      "README.md",
      "LICENSE"
    ]
  );

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

/*
@param url  full url returned from func main
@param fwrite (relative_path,content) => Promise
fwrite is write content in relative path, return a Promise resolved if success 
e.g. fwrite("./foo/bar.txt","hello") will write "hello" in "./foo/bar.txt"
@param fhash (root_path) => Promise
calculate hash for root_path in local, 
return Promise resloved a string (hash) if success calculate,
special resoved "" if root_path absent
e.g. fhash("foo.js") calcuate hash for "foo.js" in local
hash: see more at func main
*/
function clone(url,fwrite,fhash){
  
}
