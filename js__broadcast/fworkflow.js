/*framework by me, finished by GPT*/
class fworkflow{
  static #workflow = new Map();

  /*
  return list of all linked workflow summary 
  see more workflow.summary
  */
  static get_all_summary(){
    return [...fworkflow.#workflow.keys()];
  }

  /*
    summary workflow summary
    return 
       related description of linked workflow
       null  no linker
    see more workflow.summary
  */
  static get_description_of(summary){
    return fworkflow.#workflow.get(summary)?.description() ?? null;
  }

  /*
    link workflow for auto boardcast depends workflow summary
    wf workflow
    see more workflow.summary
  */
  static link_workflow(wf){
    if( wf /*instance of workflow*/){
      let summary = wf.summary();
      if(fworkflow.#workflow.has(summary)){
        throw Error("linked!");
      }else{
        fworkflow.#workflow.set(
          summary,
          wf
        );
      }
    }else{
      throw Error("wf is not workflow");
    }
  }

  /*
  start and auto broadcast the workflow
  summary workflow summary
  see more workflow.summary
  */
  static workflow(summary){
    let wf = fworkflow.#workflow.get(summary) ?? null;
    if(wf === null){
      return Promise.reject(
        Error("workflow no exist");
      );
    }else{
      return Promise.all(
        wf.depends().map(fworkflow.workflow)
      ).then(
        (lists) => /*type checer*/
      ).then(
        (workflows) => wf.run(workflows)
      ).then(
        (workflow) => {
          if(workflow === null){
            //todo
          }else{
            //todo
          }
        }
      );
    }
  }
    
  
}

class workflow{

  /*return const string of workflow summary*/
  /*abstract*/ summary(){}

  /*return const string of workflow description*/
  /*abstract*/ description(){}


  /*return 
      const list of workflow summary depends
      [] no depends
  */
  /*abstract*/ depends(){}

  /*return 
      const list of workflow summary to notice
      [] no notices
  */
  /*abstract*/ notices(){}

  /*
    start this workflow
    workflows
        list of workflow depends, in this.depends() orders
        [] for beigin workflow, required this.depends() === []
    return Promise
        resolved workflow for next workflow
        resolved null for end workflow
  */
  /*abstract*/ start(workflows){}
  
}
