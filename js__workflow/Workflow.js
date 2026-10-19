/*framework by me, cowork with GPT, Claude*/

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
    called once per chain on the prototype
    where workflow has just finished
    (inherited definition included)

    `before` is a Promise:
      fulfilled with no value if the workflow chain succeeds
      rejected with an Error if the workflow chain fails
  */
  /*abstract*/ workflow_continuation(before){
    return before;
  }

  
   /*
    Execute workflow chain from THIS

    If THIS is a Workflow instance:
      return the Promise processed by workflow_continuation
    Otherwise:
      return a rejected Promise with a type error

    The workflow chain from THIS
      executes, in order, each workflow_this defined by a class
      on the prototype chain of THIS, from THIS up to Workflow,
      skipping classes that do not define it themselves
  */
  static workflow_from(THIS){
    if(THIS instanceof Workflow){
      return Workflow.#continuous(THIS);
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
          case Workflow.continuous:
            return Workflow.#continuous(THIS,PROTO);
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
      },
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
    Continue workflow execution with the nearest superclass
    that defines workflow_this itself
  */
  static continuous = Symbol("continuous");
  
  /*
    Finish workflow execution successfully
  */
  static finish = Symbol("finish");
  
  static #continuous(THIS,PROTO = THIS){
    for(
      PROTO = Object.getPrototypeOf(PROTO);
      Object.hasOwn(PROTO, "workflow_this") === false;
      PROTO = Object.getPrototypeOf(PROTO)
    ){}
    
    return Workflow.#workflow_from(THIS,PROTO);
  }
  
  static #finish(THIS,PROTO,result){
    return PROTO.workflow_continuation.call(
      THIS,
      result
    );
  }

}
