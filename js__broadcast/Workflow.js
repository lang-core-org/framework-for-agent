/*framework by me,cowork with GPT*/

/*Workflow that executes its superclass workflows after itself*/
class Workflow {

  /*Execute this workflow.
    Returns a Promise:
      fulfilled with ****** if successful
      rejected with an Error if it fails
  */
  /*abstract*/ workflow_this() {
    return Promise.resolve(Workflow.finish);
  }

  /*Execute this workflow and all superclass workflows.
    Returns a Promise:
      fulfilled with no value if all workflows succeed
      rejected with an Error if any workflow fails

    Execution order:
      execute this workflow first, then its superclass workflows
      stop execution if any workflow fails
      stop before executing Workflow itself
  */
  static workflow_from(THIS) {
    return THIS.workflow_this().then(
      (fafter) => {
        if(
          [
            Worflow.continuos,
            Workflow.finish
          ].includes(fafter)
        ){
          return fafter(THIS);
        }else{
          throw Error("illegal params");
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
  continuous workflow to supperclass
  */
  static continuous(THIS){
    let SUPER = Object.getPrototypeOf(
          Object.getPrototypeOf(THIS)
        );
    return Workflow.workflow_from_this(SUPER);
  }

  /*
  finish workflow
  */
  static finish(THIS){
    return Promise.reslove();
  }
}
no
