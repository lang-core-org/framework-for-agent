/*
THIS FILE framework by me, finished by Claude
THIS REPO LICENSE at https://afw.lang-core.org/LICENSE
*/
class repo{


     constructor(){
     }

     /*
     nano repo: first-level folder of this repo
     return Promise resolved as flatten list,
     which element is a full url for nano repo, like:
           https://afw.lang-core.org/<lang>__<repo-name>__<depend-repo-name>__<depend-repo-name>__...__<depend-repo-name>
     <lang>
          lang for this nano repo, matched
          /^[Aa-Zz]+[0-9]*$/
     <repo-name>
          name for summary this nano repo, matched
          /^[Aa-Zz]+(_[Aa-Zz]+)*$/
     <depend-repo-name>
          <repo-name> of depend nano repo
     NOTE
         if a nano repo's name is illform,
         returned Promise should reject and guide how to fix
     */
     list_nano_repo(){
          
     }
     
     /*
     nano_repo
         a full url returned by list_nano_repo
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
         sync_nano_repo should always override nano_repo, 
         and its depend nano repo
     */
     sync_nano_repo(nano_repo,fclear,fwrite){
          
     }
}
