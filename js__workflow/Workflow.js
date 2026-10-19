/*framework by me, cowork with GPT, Claude*/

/*
Workflow that executes its superclass workflows 
after itself
*/
class Workflow {
  
  /*
    Execute this workflow
    `this`  instance of T, where:
          T is class defining this method
    Returns Promise:
      fulfilled with a workflow control signal:
        Workflow.continuous to continue with the superclass
        Workflow.finish to finish the workflow chain
      rejected with an Error if execution fails
  */
  /*abstract*/ workflow_this() {
    return Promise.resolve(Workflow.finish);
  }


  /*
    Continuation of this workflow,
    called on the prototype where workflow has just finished

    `before` is a Promise:
      fulfilled with no value if the workflow chain succeeds
      rejected with an Error if the workflow chain fails
  */
  /*abstract*/ workflow_continution(before){
    return before;
  }

  
  /*
    Execute the workflow chain for THIS

    If THIS is a Workflow instance:
      return the Promise processed by workflow_continution
    Otherwise:
      return a rejected Promise with a type error
  */
  /*final*/ static workflow_from(THIS){
    if(THIS instanceof Workflow){
      let PROTO = Object.getPrototypeOf(THIS);
      return Workflow.#workflow_from(THIS,PROTO);
    }else{
      return Promise.reject(
        Error(
          "Invalid argument: expected Workflow instance"
        )
      );
    }
  }
  
  static #workflow_from(THIS,PROTO) {
    return PROTO.workflow_this.call(THIS).then(
      (signal) => {
        switch(signal){
          case Workflow.continuos:
            return Workflow.#continuos(THIS,PROTO);
          case Workflow.finish:
            return Workflow.#finish(
              THIS,
              PROTO,
              Promise.resolve()
            );
          default:
            return Workflow.#finish(
              THIS,
              PROTO,
              Promise.reject(
                Error("Invalid workflow signal")
              )
            );
        }
      }
    ).catch(
      (e) => {
        if (e instanceof Error) {
          return Workflow.#finish(
            THIS,
            PROTO,
            Promise.reject(
              e
            )
          );
        } else {
          return Workflow.#finish(
            THIS,
            PROTO,
            Promise.reject(
              Error(
                "Workflow execution failed with a non-Error value"
              )
            )
          );
        }
      }
    );
  }
  
  /*
    Continue workflow execution with the superclass
  */
  static continuous = Symbol("continuos");
  
  /*
    Finish workflow execution successfully
  */
  static finish = Symbol("finish");
  
  static #continuous(THIS,PROTO){
    let SUPER = Object.getPrototypeOf(PROTO);
    return Workflow.#workflow_from(THIS,SUPER);
  }
  
  static #finish(THIS,PROTO,result){
    return PROTO.workflow_continution.call(
      THIS,
      result
    );
  }

}
