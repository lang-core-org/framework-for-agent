/*framework by me, cowork with Claude, Gemini, DeepSeek*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  #fread;
  #fwrite;
  #fexist;
  #fdelete;
  #path;
  #wait;
  #asking = false;
  
/*
  fread, fwrite, fexist, fdelete are injected file-access functions;
  how val is serialized and where the file lives is up to them.

  fread(path) => Promise<val>
    resolves with the value stored in path
  fwrite(path, val) => Promise
    stores val in path
  fexist(path) => Promise<bool>
    true if path exists, false otherwise
  fdelete(path) => Promise
    removes path; succeeds silently if absent

  Contract:
  - Atomic: a reader never observes a partial write.
  - The peer must create its reply atomically.

  Protocol (the existence of path is the notification), in sequence:
    path written : we have asked
    path deleted : the peer has read
    path written : the peer has answered
    path deleted : we have read
  
  path: the file shared with the peer, initially absent
  wait: polling interval in ms
*/
  constructor(fread,fwrite,fexist,fdelete,path,wait = 200){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#fexist = fexist;
    this.#fdelete = fdelete;
    this.#path = path;
    this.#wait = wait;
  }

/*
  Write val to the file, wait for the peer to read it (file deleted),
  then wait for the peer's reply (file written), read it.
  The file is deleted afterwards.
  Concurrent calls are serialized.
*/
  async ask(val){
    
    await this.#unique_lock();
    
    try{
      await this.#fwrite(this.#path,val);
      //notice asked

      await this.#notice(false);
      //be noticed answering
      await this.#notice(true);
      //be noticed answered
      
      return await this.#fread(this.#path);
      
    } finally {
      await this.#release_lock();
    }
  }

  async #wait_for(fcond){
    while(await fcond() === false){
      await setTimeout(this.#wait, undefined, { ref: false });
    }
  }

  async #notice(is_exist){
    await this.#wait_for(
      async () => (await this.#fexist(this.#path)) === is_exist
    );
  }



  async #unique_lock(){
    await this.#wait_for(
      () => {
        switch(this.#asking){
          case true:
            return false;
          case false:
            this.#asking = true;
            return true;
          default:
            throw Error("unable to get unique lock");
        }
      }
    );
  }

  async #release_lock(){
    try{
      await this.#fdelete(this.#path);
      //notice asking
      
      this.#asking = false;
    }catch(e){
      this.#asking = null;
      throw new Error(
        "unable to release lock", 
        { cause: e }
      );
    }
  }

}
