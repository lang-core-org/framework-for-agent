/*framework by me, cowork with Claude, DSH, Gemini*/

import { setTimeout } from "node:timers/promises";
export class Synchronized{
  static #locked = true;
  static #unlocked = false;
  
  
  /*
  func (args...) => T
    A function that requires unique execution at any given time,
    executed strictly after a successful reset
  reset () => void
    A function bound to func used to reset states prior to func execution.
    Throws if it fails, which aborts and prevents func from executing
  wait
    Polling interval in milliseconds 
    default = 0
  Returns (args...) => T
    A wrapped async function of func
  */
  static sync(
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
  
  /*
  wait
    Polling interval in milliseconds
  fcond () => boolean
    A condition function polled until it returns true
  */
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
  
}
