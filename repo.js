/*
THIS FILE framework by me, finished by Claude
THIS REPO LICENSE at https://afw.lang-core.org/LICENSE
*/
class repo{

     #timestamp = Promise.reject("unavailable ...");
     #nano_repo_remote;
     #nano_repo_local;



     /*
        nano_repo a string that is nano repo name split by " "
        initially, nano_repo === ""
     */
     constructor(nano_repo){
          
          if(nano_repo === ""){
               this.#nano_repo_local = Promise.resolve(new Map());
          }else{
               this.#nano_repo_local = Promise.all(
                    nano_repo.split(" ")
                             .map(repo.#checked_nano_repo_name)
               ).then(
                    (ls) => new Map(
                         ls.map( 
                              (name) => [
                                   name,
                                   repo.#sync_job
                              ]
                         )
                    )
               );
          }

          //other init
          
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
          name for summary this nano repo, matched
          /^[A-Za-z]+(_[A-Za-z]+)*$/
     <depend-repo-name>
          <repo-name> of depend nano repo
     NOTE
         if a nano repo's name is illform,
         returned Promise should reject and guide how to fix
     */
     list_nano_repo(){
          
     }
 
     /*
     fclear
         (relative_path) => Promise
         clear and remove relative_path recursively if existed,
         return resolved if success
     fwrite
         (relative_path,blob) => Promise
         write blob into relative_path,
         return resolved if success
     return 
         Promise resolved if success
     NOTE
         sync_nano_repo should always override local
     */
     sync_nano_repo(fclear,fwrite){
          Promise.all(
               [
                    this.#timestamp,
                    this.#nano_repo_remote,
                    this.#nano_repo_local
               ]
          ).then(
               (
                    [
                         ts,
                         remote,
                         local
                    ]
               ) => {
                    this.#timestamp = Promise.reject("expired ...");
                    let sync_file = new Set();
                    let fsync = (nano_repo) => {
                         if(remote.has(repo_n === false)){
                              fclear
                         }else{
                              
                              for(let path of remote[nano_repo]){
                                   sync_file.add(path);
                              }

                              for(let depend_repo of





                                  
                         }
                    };
                    
                    
                    for(let [name,job] of local){
                    job(fclear,fsync)(name);
               }
               }
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
              name.test(
                   repo.#nano_repo_name_reg
              ) === true
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


     static #sync_job(fremove,fsync){
          return fsync;
     }
     
     static #remove_job(fremove,fsync){
          return fremove;
     }
     
}
