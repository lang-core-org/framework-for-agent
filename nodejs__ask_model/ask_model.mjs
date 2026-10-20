/*framework by me, cowork with Claude,Gemini*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  #fread;
  #fwrite;
  #ftimestamp;
  #path;

  /*
    fread (path) => Promise
      resolve as val read from path
    fwrite (path,val) => Promise
      resolve timestamp if write val into path succeed
    ftimestamp (path) => Promise
      reslove timestamp as last change time of path
    path
      a specified file
  */
  constructor(fread,fwrite,ftimestamp,path){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#ftimestamp = ftimestamp;
    this.#path = path;
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
    this.#T = this.#fwrite(this.#path,val);
    await ask_model.#wait_for(
      async () => this.#T !== this.#ftimestamp(this.#path)



      
    );
    let ans = await this.#fread(this.#path);
    this.#T = null;
    return ans;
  }

  static async #wait_for(fcond){
    while(fcond() === false){
      await setTimeout(0, undefined, { ref: false });
    }
  }

}
