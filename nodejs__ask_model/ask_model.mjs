/*framework by me, cowork with Claude, Gemini, DeepSeek*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  #fread;
  #fwrite;
  #fexist;
  #fdelete;
  #path;
  #wait;
/*
  fread, fwrite, ftimestamp are injected file-access functions;
  how val is serialized and where the file lives is up to them.

  fread(path) => Promise<val>
    resolves with the value currently stored in path
  fwrite(path, val) => Promise<???>
    stores val in path, resolves with the file's timestamp after this write
  fexist(path) => Promise<bool>
    resolves with the file's current timestamp
    true file exsit, false file absent

  Contract:
  - Atomic: a reader never observes a partial write.
  - Every write, by us or by the peer, must change the timestamp.
  - The timestamp from fwrite must equal what ftimestamp returns
    right after, unless the peer has written in between.

  path: the file shared with the peer
  wait: polling interval in ms (0 = as fast as the event loop allows)
  timeout: 16 * wait
*/
  constructor(fread,fwrite,fexist,fdelete,path,wait = 0){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#fexist = fexist;
    this.#fdelete = fdelete;
    this.#path = path;
    this.#wait = wait;
  }



  #timeout = 16;
  #asking = false;
  
/*
  Write val to the file, wait for the peer to change it, resolve with the new content.
  Concurrent calls are serialized.
  The peer's reply must change the file's timestamp.
*/
  async ask(val){
    try{
      
      await this.#wait_for(
        () => {
          if(this.#asking === false){
            this.#asking = true;
            return true;
          }else{
            return false;
          }
        }
      );
      
      await this.#fdelete(this.#path);
      await this.#fwrite(this.#path,val);

      await this.#notice(false); 
      //file has been read
      await this.#notice(true);
      //answered is arrived
      return await this.#fread(this.#path);
      
    } finally {
      
      this.#asking = false;
      
    }
  }

  async #wait_for(fcond){
    while(await fcond() === false){
      await setTimeout(this.#wait, undefined, { ref: false });
    }
  }

  async #notice(is_exsit){
    let count = this.#timeout;
    let signal = undefined;
    await this.#wait_for(
      async () => {
        count = count - 1;
        signal = (await this.#fexist(this.#path)) === is_exsit;
        return (count <= 0) || signal;
      }
    );
    
    if(signal === true){
      return;
    }else{
      throw Error("time-out");
    }
  }

}
