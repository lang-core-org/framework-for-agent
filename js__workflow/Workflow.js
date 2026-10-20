/*framework by me, cowork with GPT, Claude*/

class Workflow {
  
    /*
    Execute this workflow
    `this`  instance of T, where:
          T is class defining this method
    `param` the value passed in
    Returns one of:
      Workflow.continuous_with(value)
          to continue with the superclass
      Workflow.finish_with(value)
          to finish the workflow chain
      Workflow.abort_with(error)
          to abort the workflow chain because of error
      otherwise
          the workflow chain fails with a RangeError
    Throws
       no recommend
  */
  /*abstract*/ workflow_this(param) {
    return Workflow.finish_with(param);
  }


  /*
    Continuation of this workflow,
    called once per chain on the prototype
    where workflow has just finished
    (inherited definition included)
    
    `before` is a Promise:
      fulfilled with the value of finish_with if the workflow chain succeeds
      rejected with an Error if the workflow chain fails
  */
  /*abstract*/ workflow_continuation(before){
    return before;
  }
  
  
  /*
    Execute workflow chain from THIS with param

    THIS must be an instance of Workflow or of its subclass,
    constructed by the class constructor

    If THIS is such an instance:
      return the Promise processed by workflow_continuation
    Otherwise:
      return a rejected Promise with a TypeError

    The workflow chain from THIS
      executes, in order, each workflow_this defined by a class
      on the prototype chain of THIS, from THIS up to Workflow,
      skipping classes that do not define it themselves.
      The first receives param, the others receive
      the value of the previous continuous_with
  */
  static workflow_from(THIS,param){
    if(Workflow.#extends_Workflow(THIS)){
      return Workflow.#continuous(THIS,param);
    }else{
      return Promise.reject(
        TypeError(
          "Invalid argument: expected Workflow instance"
        )
      );
    }
  }
  
  static #workflow_from(THIS,param,PROTO) {
    let result;
    try{
      result = PROTO.workflow_this.call(THIS,param);
    }catch(e){
      result = Promise.reject(e);
    }
    return result.then(
      (V) => {
        switch(Workflow.#read_signal(V)){
          case Workflow.#sym_continuous:
            return Workflow.#continuous(
              THIS,
              V.#value,
              PROTO
            );
          case Workflow.#sym_finish:
            return Workflow.#finish(
              THIS,
              PROTO,
              Promise.resolve(V.#value)
            );
          default:
            return Workflow.#finish(
              THIS,
              PROTO,
              Promise.reject(
                RangeError("Invalid workflow signal")
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
              TypeError(
                "Workflow execution failed with a non-Error value"
              )
            )
          );
        }
      }
    );
  }
  
  
  static #sym_continuous = Symbol("continuous");
  static #sym_finish = Symbol("finish");

  #signal = null;
  #value = null;
  
  /*
    Signal for workflow_this:
    continue with the nearest superclass that defines workflow_this itself,
    passing value as its param
  */
  static continuous_with(value){
    return Workflow.#passing(
      Workflow.#sym_continuous,
      value
    );
  }

  /*
    Signal for workflow_this:
    finish the workflow chain with value
  */
  static finish_with(value){
    return Workflow.#passing(
      Workflow.#sym_finish,
      value
    );
  }

  /*
    Signal for workflow_this:
    abort the workflow chain because of error
  */
  static abort_with(error){
    return Promise.reject(error);
  }
  

  static #continuous(THIS,param,PROTO = THIS){
    for(
      PROTO = Object.getPrototypeOf(PROTO);
      Object.hasOwn(PROTO, "workflow_this") === false;
      PROTO = Object.getPrototypeOf(PROTO)
    ){}
    
    return Workflow.#workflow_from(THIS,param,PROTO);
  }
  
  static #finish(THIS,PROTO,result){
    return PROTO.workflow_continuation.call(
      THIS,
      result
    );
  }

  static #extends_Workflow(value){
    return (
      (value instanceof Workflow) &&
      (#signal in value) &&
      (#value in value)
    );
  }

  static #read_signal(value){
    if(Workflow.#extends_Workflow(value)){
      return value.#signal;
    }else{
      return null;
    }
  }

  static #passing(signal,value){
    let w = new Workflow();
    w.#signal = signal;
    w.#value = value;
    return Promise.resolve(
      Object.freeze(w)
    );
  }

  static {
    Object.freeze(this);
    Object.freeze(this.prototype);
  }
  
}
