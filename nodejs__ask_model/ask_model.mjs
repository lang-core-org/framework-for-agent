/*framework by me, cowork with Claude, Gemini, DeepSeek*/

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
    NOTE: fxxxx should be atomic
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
     write val into file
     wait model changed file atomic as answer
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
