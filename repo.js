/*
THIS FILE framework by me, finished by Claude
THIS REPO LICENSE at https://afw.lang-core.org/LICENSE
*/
class repo{

     static #root = "afw.lang-core.org";
     static #github = "lang-core-org/framework-for-agent";

     #timestamp;
     #nano_repo_remote;
     #linker;
     #nano_repo_local;


     /*
        manifest  list of nano repo name
        remap (repo_name,remote) => list
             repo_name  <repo-name> which is not found in remote
             remote  resolved this.list_nano_repo()
             return 
                 list of requires nano repo name instead of repo_name
                 [] if no requires
        NOTE
           manifest is collection of first-level folder of MAIN
           MAIN see it at sync_nano_repo
           <repo-name> see it at list_nano_repo
     */
     constructor(manifest,remap){

          this.#timestamp = repo.#quiet(
               repo.#fetch_stamp()
          );

          this.#nano_repo_remote = repo.#quiet(
               this.#timestamp.then(
                    () => repo.#fetch_tree()
               ).then(
                    (tree) => repo.#build_remote(tree)
               )
          );

          this.#linker = repo.#quiet(
               this.#nano_repo_remote.then(
                    (R) => Promise.all(
                         [...R.keys()].map(
                              (k) => repo.get_repo_name(k).then(
                                   (N) => [N, k]
                              )
                         )
                    )
               ).then(
                    (L) => new Map(L)
               )
          );

          this.#nano_repo_local = repo.#quiet(
               Promise.all(
                    manifest.map(repo.get_repo_name)
               ).then(
                    (repo_name_ls) => this.#linker.then(
                         (linker) => repo_name_ls.map(
                              (N) => linker.get(N) ?? N
                         )
                    )
               ).then(
                    (nano_repo_ls) => new Map(
                         nano_repo_ls.map(
                              (name) => [
                                   name,
                                   repo.#auto_job(
                                        this.#nano_repo_remote,
                                        remap
                                   )
                              ]
                         )
                    )
               )
          );

     }
     
     /*
     nano repo: first-level folder of this repo
     return Promise resolved as flatten list,
     which element is nano repo name, like:
           
           <lang>__<repo-name>[__<depend-repo-name>__...__<depend-repo-name>]
     
     <lang>
          lang for this nano repo, matched
          /^[A-Za-z]+[0-9]*$/
     <repo-name>
          name for summary and identify this nano repo, matched
          /^[A-Za-z]+(_[A-Za-z]+)*$/
     <depend-repo-name>
          <repo-name> of depend nano repo
     NOTE
         if a nano repo's name is illform,
         returned Promise should reject and guide how to fix
     */
     list_nano_repo(){
          return this.#nano_repo_remote.then(
               (remote) => [...remote.keys()]
          );
     }
 
     /*
     TMP
        a empty folder for fetch temporary
        (don't forget clear it manually)
     MAIN
        a folder where really store nano repo locally
     fwrite
         (relative_path,blob) => Promise
         write blob into relative_path under TMP,
         return resolved if success
     fcommit
         () => Promise
         clear MAIN,
         copy TMP into MAIN,
         return resolved if success
     return 
         Promise resolved if success
     NOTE
         sync_nano_repo should always override local
         sync_nano_repo is a FINALLY METHOD of this class
     */
     sync_nano_repo(fwrite,fcommit){
          const T = this.#timestamp;
          this.#timestamp = repo.#quiet(
               Promise.reject(
                    "Expired: sync_nano_repo can be called only once per repo object. Create a new repo() to sync again."
               )
          );

          return Promise.all(
               [
                    T,
                    this.#nano_repo_remote,
                    this.#nano_repo_local,
                    this.#linker
               ]
          ).then(
               (
                    [
                         ts,
                         remote,
                         local,
                         linker
                    ]
               ) => {

                    const sync_repo = new Set();
                    const sync_file = new Set();

                    const fsync = (nano_repo) => {
                         if(remote.has(nano_repo) === false){
                              return Promise.reject(
                                   `Nano repo "${nano_repo}" not found in the remote repo. See list_nano_repo().`
                              );
                         }else if(sync_repo.has(nano_repo) === false){
                              sync_repo.add(nano_repo);

                              for(const path of remote.get(nano_repo)){
                                   sync_file.add(path);
                              }

                              return repo.get_depend_repo_name(nano_repo)
                                         .then(
                                              (depends) => Promise.all(
                                                   [...depends].map(
                                                        (t) => {
                                                             if(linker.has(t) === true){
                                                                  return fsync(linker.get(t));
                                                             }else{
                                                                  return Promise.reject(
                                                                       `Dependency "${t}" of "${nano_repo}" not found: no nano repo has <repo-name> "${t}".`
                                                                  );
                                                             }
                                                        }
                                                   )
                                              )
                                         );
                         }else{
                              return Promise.resolve();
                         }
                    };

                    return Promise.all(
                         [...local].map(
                              ( [nano_repo,job] ) => job(fsync)(nano_repo)
                         )
                    ).then(
                         () => Promise.all(
                              [...sync_file].map(
                                   (path) => fetch(
                                        `https://${repo.#root}/` +
                                        path.split("/").map(encodeURIComponent).join("/") +
                                        `?v=${encodeURIComponent(ts)}`
                                   ).then(
                                        (res) => {
                                             if(res.ok === true){
                                                  return res.blob();
                                             }else{
                                                  return Promise.reject(
                                                       `Download failed (${res.status}): ${path}. The site may not have deployed the latest push yet; retry later.`
                                                  );
                                             }
                                        }
                                   ).then(
                                        (blob) => fwrite(path,blob)
                                   )
                              )
                         )
                    ).then(
                         () => repo.#fetch_stamp()
                    ).then(
                         (now) => {
                              if(now === ts){
                                   return fcommit();
                              }else{
                                   return Promise.reject(
                                        `The remote repo changed during sync (${ts} -> ${now}). Nothing was committed. Clear TMP and create a new repo() to retry.`
                                   );
                              }
                         }
                    );
               }
          );
               
     }



     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise resolved if success planning to required
     */
     require_nano_repo(nano_repo){
          return repo.#checked_nano_repo_name(nano_repo)
                     .then(
                          (R) => this.#nano_repo_local.then(
                               (local) => {
                                    local.set(
                                         R,
                                         repo.#sync_job
                                    );
                                    return null;
                               }
                          )
                     );
     }

     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise resolved if success planning to removed
     */
     remove_nano_repo(nano_repo){
          return repo.#checked_nano_repo_name(nano_repo)
                     .then(
                          (R) => this.#nano_repo_local.then(
                               (local) => {
                                    local.set(
                                         R,
                                         repo.#remove_job
                                    );
                                    return null;
                               }
                          )
                     );
     }
     

     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise resolved as <lang>
     */
     static get_lang(nano_repo){
          return repo.#groups_nano_repo_name(nano_repo)
                     .then(
                          ({lang}) => lang
                     );
     }

     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise resolved as <repo-name>
     */
     static get_repo_name(nano_repo){
          return repo.#groups_nano_repo_name(nano_repo)
                     .then(
                          ({repo_name}) => repo_name
                     );
     }

     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise resolved as a set of <depend-repo-name>
     */
     static get_depend_repo_name(nano_repo){
          return repo.#groups_nano_repo_name(nano_repo)
                     .then(
                          ({depends}) => new Set(
                               depends.split("__").slice(1)
                          )
                     );
     }
     


     static #nano_repo_name_reg =
     /^(?<lang>[A-Za-z]+[0-9]*)__(?<repo_name>[A-Za-z]+(_[A-Za-z]+)*)(?<depends>(__[A-Za-z]+(_[A-Za-z]+)*)*)$/;
     
     static #checked_nano_repo_name(name){
         if(
              repo.#nano_repo_name_reg.test(name) === true
         ){
             return Promise.resolve(name);
         }else{
              return Promise.reject(
                   `Invalid nano repo name "${name}". ` +
                   `Expected <lang>__<repo-name>[__<depend-repo-name>...], ` +
                   `<lang> matches /^[A-Za-z]+[0-9]*$/, each <repo-name> matches /^[A-Za-z]+(_[A-Za-z]+)*$/. ` +
                   `If it is a first-level folder of the remote repo, rename that folder.`
              );
         }
     }


     static #groups_nano_repo_name(name){
          return repo.#checked_nano_repo_name(name)
                     .then(
                          (N) => repo.#nano_repo_name_reg.exec(N).groups
                     );
     }


     static #quiet(promise){
          promise.catch( () => {} );
          return promise;
     }


     static #get_json(url){
          return fetch(
               url,
               {
                    headers: {
                         Accept: "application/vnd.github+json"
                    }
               }
          ).then(
               (res) => {
                    if(res.ok === true){
                         return res.json();
                    }else{
                         return Promise.reject(
                              `GitHub API request failed (${res.status}): ${url}. ` +
                              `If 403 or 429, the anonymous rate limit (60 requests/hour) is probably used up; retry later.`
                         );
                    }
               }
          );
     }

     static #fetch_stamp(){
          return repo.#get_json(
               `https://api.github.com/repos/${repo.#github}`
          ).then(
               (data) => {
                    if(typeof data.pushed_at === "string"){
                         return data.pushed_at;
                    }else{
                         return Promise.reject(
                              "GitHub API returned no pushed_at for this repo."
                         );
                    }
               }
          );
     }

     static #fetch_tree(){
          return repo.#get_json(
               `https://api.github.com/repos/${repo.#github}/git/trees/HEAD?recursive=1`
          ).then(
               (data) => {
                    if(data.truncated === true){
                         return Promise.reject(
                              "GitHub file tree is truncated: the repo has too many files to list in one request."
                         );
                    }else{
                         return data.tree;
                    }
               }
          );
     }

     static #build_remote(tree){
          const names = tree.filter(
               (i) => i.type === "tree" && i.path.includes("/") === false
          ).map(
               (i) => i.path
          );

          return Promise.all(
               names.map(
                    (n) => repo.get_repo_name(n).then(
                         (N) => [N, n]
                    )
               )
          ).then(
               (pairs) => {
                    const seen = new Map();
                    for(const [N, n] of pairs){
                         if(seen.has(N) === true){
                              return Promise.reject(
                                   `Duplicate <repo-name> "${N}" in "${seen.get(N)}" and "${n}". <repo-name> must be unique; rename one of them.`
                              );
                         }else{
                              seen.set(N, n);
                         }
                    }

                    const remote = new Map(
                         names.map( (n) => [n, []] )
                    );
                    for(const i of tree){
                         const k = i.path.split("/")[0];
                         if(
                              i.type === "blob" &&
                              i.path.includes("/") === true &&
                              remote.has(k) === true
                         ){
                              remote.get(k).push(i.path);
                         }
                    }
                    return remote;
               }
          );
     }


     static #sync_job(fsync){
          return fsync;
     }
     
     static #remove_job(fsync){
          return (u) => u;
     }

     static #auto_job(remote,remap){
          return (fsync) => (nano_repo) =>
               remote.then(
                    (R) => {
                         if( R.has(nano_repo) === true){
                              return fsync(nano_repo);
                         }else{
                              return Promise.all(
                                   remap( nano_repo, [...R.keys()] ).map(fsync)
                              );
                         }
                    }
               );
     }
     
}
