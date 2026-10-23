/*framework by me, cowork with Claude, DSH, Gemini*/

import { setImmediate, setTimeout } from "node:timers/promises";

export class Synchronized{
  
  /*
  func (args...) => T
    A function that requires unique execution at any given time,
    executed strictly after a successful reset
  reset () => void
    A function bound to func used to reset states prior to func execution.
    Throws if it fails, which aborts and prevents func from executing
  Returns (args...) => Promise<T>
    A wrapped async function of func
  */
  static sync(
    func,
    reset
  ){
    let micro_task = Promise.resolve(null);
    return (...args) => {
      let then_func = async (_) => {
        try{
          await reset();
        }catch(e){
          throw new Error(
            "fail to reset",
            {cause: e}
          );
        }
        return func(...args);
      };
      
      let result = micro_task.then(then_func);
      micro_task = result.catch(() => null);
      
      return result;
    };
  }
  
  /* 
  fcond () => boolean | Promise<boolean>
    A condition function polled until it returns true
  await setImmediate() between checks
  */
  static async spin_for(fcond){
    while(await fcond() === false){
      await setImmediate();
    }
  }

  /*
  wait
    Polling interval in milliseconds
  fcond () => boolean | Promise<boolean>
    A condition function polled until it returns true
  */
  static async wait_for(wait,fcond){
    while(await fcond() === false){
      await setTimeout(wait);
    }
  }
  
}
