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
  start and auto broadcast workflow
  summary workflow summary
  see more workflow.summary
  */
  static start_workflow(summary){
    return fworflow.#wofkflow(
      summary,
      new Set(),
      new Map()
    );
  }






  
  static #workflow(
    summary, //this workflow summary
    after, //workflow after this workflow
    before //workflow before this workflow
  ){
    let W = fworkflow.#workflow.get(summary) ?? null;
    if(W === null){
      return Promise.reject(
        Error("workflow no exist");
      );
    }else{
      let D = fworkflow.#workflow_depends(W);
      let B = new Map(before);
      
      for(let d of D){
        if(B.has(d) === true){
          //pass
        }else{
          let A = new Set(after);
          A.add(summary);
          B.set(
            d,
            fworkflow.#workflow(d,A,new Map())
          );
        }
      }

      for(let b of B.keys()){
        
      }

      
      
    }
  }


  static #workflow_depends(workflow){
    return new Set(workflow.depends());
  }

  static #workflow_notices(workflow){
    let N = new Set(workflow.notices());
    let S = workflow.summary();
    for(let wf of fworkflow.values()){
      if(
        fworflow.#workflow_depends(wf).has(S) === true
      ){
        N.add(wf);
      }else{
        //pass
      }
    }
    return N;
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
    params
        Map of workflow depends,
        where keys is new Set(this.depends())
    return Promise
        resolved workflow for next workflow
        resolved null for end workflow
  */
  /*abstract*/ start(params){}
  
}
