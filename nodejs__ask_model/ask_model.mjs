/*framework by me, cowork with Claude, Gemini*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  #fread;
  #fwrite;
  #ftimestamp;
  #path;
  #wait;

  /*
    fread (path) => Promise
      resolve as val read from path
    fwrite (path,val) => Promise
      resolve timestamp if write val into path succeed
    ftimestamp (path) => Promise
      reslove timestamp
    path
      a specified file
    wait
      time for per setTimeout, in ms
    val
      a JS value, like null, [1,2], ()=>{} ...
    timestamp
      time for last change of file
  */
  constructor(fread,fwrite,ftimestamp,path,wait = 0){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#ftimestamp = ftimestamp;
    this.#path = path;
    this.#wait;
  }



  #T = null;

  /*
  write val into file and wait model changed file as answer
  */
  async ask(val){
    await ask_model.#wait_for(
      () => this.#T === null
    );
    this.#T = 0;
    this.#T = await this.#fwrite(this.#path,val);
    await ask_model.#wait_for(
      async () => this.#T !== (
        await this.#ftimestamp(this.#path)
      )
    );
    let ans = await this.#fread(this.#path);
    this.#T = null;
    return ans;
  }

  static async #wait_for(fcond){
    while(await fcond() === false){
      await setTimeout(this.#wait, undefined, { ref: false });
    }
  }

}
