/*
THIS FILE framework by me, finished by Claude
THIS REPO LICENSE at https://afw.lang-core.org/LICENSE
*/
class repo{

     #timestamp = Promise.reject("unavailable ...").catch( ()=>{} );
     #nano_repo_remote;
     #linker;
     #nano_repo_local;


     /*
        manifest  list of nano repo name
        NOTE
           manifest is collection of first-level folder of MAIN
           MAIN see it at sync_nano_repo
     */
     constructor(manifest){

          //init timestamp

          //init remote, by the way checked name, repo-name identify 


          this.#linker = this.#nano_repo_remote.then(
               (R) => [...R.keys()]
          ).then(
               (K) => Promise.all(
                    K.map(
                         (k) => Promise.all(
                              [ repo.get_repo_name(k), k]
                         )
                    )
               )
          ).then(
               (L) => new Map(L)
          );
          
          this.#nano_repo_local = Promise.all(
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
                                   this.#nano_repo_remote
                              )
                         ]
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
          let T = this.#timestamp;
          this.#timestamp = Promise.reject("expired ...").catch(() => {});
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
                    
                    let sync_repo = new Set();
                    let sync_file = new Set();
                    let fsync = (nano_repo) => {
                         if(remote.has(nano_repo) === false){
                              return Promise.reject("depend remote absent ...").catch(()=>{});
                         }else if (sync_repo.has(nano_repo) === false){
                              sync_repo.add(nano_repo);
                              
                              for(let path of remote.get(nano_repo) ){
                                   sync_file.add(path);
                              }
                              
                              return repo.get_depend_repo_name(nano_repo)
                                         .then(
                                              (depends) => [...depends].map( 
                                                   (t) => linker.get(t) ?? t
                                              )
                                        ).then(
                                              (depend_nano_repo) => 
                                                   Promise.all(
                                                        depend_nano_repo.map( fsync )
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
                         () => {
                              //actual download & write
                         }
                    );
               }
          );
               
     }



     /*
     nano_repo
         nano repo name returned by list_nano_repo
     return
         Promise reloved if success planning to required
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
         Promise reloved if success planning to removed
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
         Promise reloved as <lang>
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
         Promise reloved as <repo-name>
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
         Promise reloved as a set of <depend-repo_name>
     */
     static get_depend_repo_name(nano_repo){
          return repo.#groups_nano_repo_name(nano_repo)
                     .then(
                          ({depends}) => new Set(
                               (depends ?? "").split("__").slice(1)
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
                   `${name} is not nano repo name, current ....`
              );
         }
     }


     static #groups_nano_repo_name(name){
          return repo.#checked_nano_repo_name(name)
                     .then(
                          (N) => repo.#nano_repo_name_reg.exec(N).groups
                     );
     }


     static #sync_job(fsync){
          return fsync;
     }
     
     static #remove_job(fsync){
          return (u) => u;
     }

     static #auto_job(remote){
          return (fsync) => (nano_repo) =>
               remote.then(
                    (R) => {
                         if( R.has(nano_repo) === true){
                              return fsync(nano_repo);
                         }else{
                              return R;
                         }
                    }
               );
     }
     
}
