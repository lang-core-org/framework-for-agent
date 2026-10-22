/*framework by me, cowork with Claude, DSH*/

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
  Throws AggregateError(
      [
          <before-locked>,
          <locking>,
          <after-locking>
      ]
  ), error in throws:
      undefined NO ERROR in this step
      Error ERROR threw in this step
*/
  async sync(fbody,fafter = () => {}, fbefore = () => {}){

    let errors = [undefined,undefined,undefined];
    
    try{
      await this.#acquire(fbefore);
    }catch(e){
      errors[0] = new Error("unable to get lock", { cause: e });
      throw new AggregateError(errors);
    }

    
    try{
      return await fbody();
    } catch(e){
      errors[1] = new Error("fbody failed", { cause: e });
    } finally {
      await this.#release(fafter,errors);
    }
  }








  
  static async sync(
    func,
    reset,
    wait = 0
  ){
    let lock = Synchronized.#unlocked;
    let getlock = () => lock;
    let setlock = (L) => {lock = L;};
    
    return async (...args) => {
      await Synchronized.#acquire(
        reset,
        wait,
        getlock,
        setlock
      );

      try{
        return await func(...args);
      } finally {
        Synchronized.#release(setlock);
      }
      
    };
  }


  static async wait_for(wait,fcond){
    while(await fcond() === false){
      await setTimeout(
        wait,
        undefined,
        { ref: true }
      );
    }
  }

  static async #acquire(reset,wait,getlock,setlock){
    await Synchronized.wait_for(
      wait,
      async () => {
        switch(getlock()){
          case Synchronized.#locked:
            return false;
          case Synchronized.#unlocked:
            try{
              setlock( Synchronized.#locked );
              await reset();
              return true;
            }catch(e){
              setlock( Synchronized.#unlocked );
              throw new Error(
                "fail to get lock, can't reset",
                { cause: e }
              );
            }
          default:
            throw new Error("unable to get lock");
        }
      }
    );
  }


  static #release(setlock){
    setlock(Synchronized.#unlocked);
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

  async #release(fafter,errors){
    try{
      await fafter();
      this.#lock = Synchronized.#unlocked;
      
    }catch(e){
      this.#lock = Synchronized.#broken;
      
      errors[2] = new Error(
        "unable to release lock",
        { cause: e }
      );
    } finally {
      if(errors.some(e => e !== undefined)){
        throw new AggregateError(errors);
      }else{
        //pass
      }
    }
  }
  
}
