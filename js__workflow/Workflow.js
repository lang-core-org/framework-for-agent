/*framework by me,cowork with GPT*/

/*
Workflow that executes its superclass workflows 
after itself.
*/
class Workflow {
  
  /*
    Execute this workflow.
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
    Execute workflows from THIS 
    THIS  instance of Workflow
    Returns Promise:
      fulfilled with no value if the workflow chain succeeds
      rejected with an Error if any workflow fails
  */
  /*final*/ static workflow_from(THIS){
    if(THIS instanceof Workflow){
      let PROTO = Object.getPrototypeOf(THIS);
      return Workflow.#workflow_from(THIS,PROTO);
    }else{
      return Promise.reject(
        Error("type error")
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
            return Workflow.#finish();
          default:
            throw Error("illegal signal");
        }
      }
    ).catch(
      (e) => {
        if (e instanceof Error) {
          throw e;
        } else {
          throw Error("Typed error", { cause: e });
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
  
  static #finish(){
    return Promise.reslove();
  }

}
