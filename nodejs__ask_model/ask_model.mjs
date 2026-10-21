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
  - Atomic: a reader never observes a partial write,
    and the peer must create its reply atomically.

  Protocol (file existence is the handshake, both sides delete after reading):
  1. ask: delete path, write question   -> file exists: peer's turn
  2. peer: read, then delete path       -> file gone: received, thinking
  3. peer: write reply atomically       -> file exists: reply ready
  4. ask: read reply

  path: the file shared with the peer
  wait: polling interval in ms
  timeout: 16 polls per step, so a step times out after about 16 * wait ms
*/
  constructor(fread,fwrite,fexist,fdelete,path,wait = 1000){
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
  Write val to the file, wait for the peer to read it (file removed),
  then wait for the peer's reply (file reappears), resolve with its content.
  Concurrent calls are serialized.
  Rejects with "time-out" if either step exceeds the timeout.
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
      //notice asking
      await this.#fwrite(this.#path,val);
      //notice asked

      await this.#notice(false);
      //be noticed answering
      await this.#notice(true);
      //be noticed answered
      
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

  async #notice(is_exist){
    let count = this.#timeout;
    let signal = undefined;
    await this.#wait_for(
      async () => {
        count = count - 1;
        signal = (await this.#fexist(this.#path)) === is_exist;
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
