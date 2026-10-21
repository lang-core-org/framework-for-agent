/*framework by me, cowork with Claude, Gemini, DeepSeek*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  #fread;
  #fwrite;
  #ftimestamp;
  #path;
  #wait;

/*
  fread, fwrite, ftimestamp are injected file-access functions;
  how val is serialized and where the file lives is up to them.

  fread(path) => Promise<val>
    resolves with the value currently stored in path
  fwrite(path, val) => Promise<timestamp>
    stores val in path, resolves with the file's timestamp after this write
  ftimestamp(path) => Promise<timestamp>
    resolves with the file's current timestamp

  Contract:
  - Atomic: a reader never observes a partial write.
  - Every write, by us or by the peer, must change the timestamp.
  - The timestamp from fwrite must equal what ftimestamp returns
    right after, unless the peer has written in between.

  path: the file shared with the peer
  wait: polling interval in ms (0 = as fast as the event loop allows)
*/
  constructor(fread,fwrite,ftimestamp,path,wait = 0){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#ftimestamp = ftimestamp;
    this.#path = path;
    this.#wait = wait;
  }



  #T = ask_model.#idle;

  static #idle = undefined;
  static #placeholder = null;
  
/*
  Write val to the file, wait for the peer to change it, resolve with the new content.
  Concurrent calls are serialized.
  The peer's reply must change the file's timestamp.
*/
  async ask(val){
    try{
      
      await this.#wait_for(
        () => {
          if(this.#T === ask_model.#idle){
            this.#T = ask_model.#placeholder;
            return true;
          }else{
            return false;
          }
        }
      );
      
      this.#T = await this.#fwrite(this.#path,val);
      
      await this.#wait_for(
        async () => this.#T !== (
          await this.#ftimestamp(this.#path)
        )
      );
      
      return await this.#fread(this.#path);
      
    } finally {
      
      this.#T = ask_model.#idle;
      
    }
  }

  async #wait_for(fcond){
    while(await fcond() === false){
      await setTimeout(this.#wait, undefined, { ref: false });
    }
  }

}
