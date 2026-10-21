/*framework by me, cowork with Claude, Gemini, DeepSeek, DSH*/

import { Synchronized } from "../nodejs__synchronized/Synchronized.js";

export class ask_model {

  #fread;
  #fwrite;
  #fexist;
  #fdelete;
  #question_path;
  #answer_path;
  #sync;
  
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
  constructor(fread,fwrite,fexist,fdelete,question_path,answer_path,wait = 200){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#fexist = fexist;
    this.#fdelete = fdelete;
    this.#question_path = question_path;
    this.#answer_path = answer_path;
    this.#sync = new Synchronized(wait);
  }

/*
  Write val to the file, wait for the peer to read it (file deleted),
  then wait for the peer's reply (file written), read it.
  The file is deleted afterwards.
  Concurrent calls are serialized.
  Waits indefinitely; there is no time-out.
  If the final delete fails, the instance is locked and later calls reject.
*/
  async ask(val){
    
    return await this.#sync.sync(
      async () => {
        await this.#notice(this.#question_path,false);
        //be noticed previous question has been processing
      
        await this.#fwrite(this.#question_path,val);
        
        await this.#notice(this.#answer_path,true);
        //be noticed this answer is prepared
        
        return await this.#fread(this.#answer_path);
      },
      () =>  this.#fdelete(this.#answer_path)
             //notice answered has been read
             
    );
  }

  async #notice(path,is_exist){
    await this.#sync.wait_for(
      async () => (await this.#fexist(path)) === is_exist
    );
  }
  
}
