/*framework by me, cowork with Claude*/

import { setTimeout } from "node:timers/promises";
export class Synchronized{
  static #locked = true;
  static #unlocked = false;
  static #broken = null;
  
  #lock = Synchronized.#unlocked;
  #wait;

/*
  Like Java's synchronized, but not reentrant:
  calling sync on the same instance inside fbody waits forever.
  wait: polling interval in ms
*/
  constructor(wait = 200){
    this.#wait = wait;
  }

/*
  Wait for the lock; once free, run fbefore synchronously
  and take the lock, then run fbody, then fafter.
  If fbefore throws, the lock is not taken and fbody, fafter do not run.
  The lock is released only if fafter succeeds;
  otherwise it is broken and every later sync rejects.
  Resolves with the result of fbody.
*/
  async sync(fbody,fafter = () => {}, fbefore = () => {}){
    await this.#acquire(fbefore);
    try{
      return await fbody();
    } finally {
      await this.#release(fafter);
    }
  }


/*
  Poll until fcond resolves to true
*/
  async wait_for(fcond){
    while(await fcond() === false){
      await setTimeout(this.#wait, undefined, { ref: false });
    }
  }

  async #acquire(fbefore){
    await this.wait_for(
      () => {
        switch(this.#lock){
          case Synchronized.#locked:
            return false;
          case Synchronized.#unlocked:
            fbefore();
            this.#lock = Synchronized.#locked;
            return true;
          default:
            throw Error("unable to get lock");
        }
      }
    );
  }

  async #release(fafter){
    try{
      await fafter();
      
      this.#lock = Synchronized.#unlocked;
    }catch(e){
      this.#lock = Synchronized.#broken;
      
      throw new Error(
        "unable to release lock", 
        { cause: e }
      );
    }
  }
  
}
