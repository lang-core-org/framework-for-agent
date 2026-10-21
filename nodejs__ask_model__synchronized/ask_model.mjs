/*framework by me, cowork with Claude, Gemini, DeepSeek, DSH*/

import { Synchronized } from "../nodejs__synchronized/Synchronized.mjs";

export class ask_model {

  #fread;
  #fwrite;
  #fexist;
  #fdelete;
  #question_path;
  #answer_path;
  #sync;
  #sync_ask;
  #sync_answer;
  
/*
  fread, fwrite, fexist, fdelete are injected file-access functions;
  how val is serialized and where the files live is up to them.

  fread(path) => Promise<val>
    resolves with the value stored in path
  fwrite(path, val) => Promise
    stores val in path
  fexist(path) => Promise<bool>
    true if path exists, false otherwise
  fdelete(path) => Promise
    removes path; succeeds silently if absent

  Contract:
  - Atomic: a reader never observes a partial write.
  - The peer must write its answer atomically
    and delete the question after reading it.

  Protocol (the existence of a file is the notification), in sequence:
    question written : we have asked
    question deleted : the peer has read
    answer written   : the peer has answered
    answer deleted   : we have read

  question_path, answer_path: files shared with the peer, initially absent
  wait: polling interval in ms
*/
  constructor(fread,fwrite,fexist,fdelete,question_path,answer_path,wait = 200){
    this.#fread = fread;
    this.#fwrite = fwrite;
    this.#fexist = fexist;
    this.#fdelete = fdelete;
    this.#question_path = question_path;
    this.#answer_path = answer_path;
    this.#sync = new Synchronized(wait);
    this.#sync_ask = new Synchronized(wait);
    this.#sync_answer = new Synchronized(wait);
  }

/*
  Wait until the peer has read the previous question,
  write val as the question, wait for the answer, read it.
  The answer is always deleted afterwards, also if a step failed.
  Concurrent calls are serialized.
  Waits indefinitely; there is no time-out.
  If that delete fails, later calls to ask reject.
*/
  async ask(val){
    
    return await this.#sync_ask.sync(
      async () => {
        await this.#notice(this.#question_path,false);
        //be noticed previous question has been read
      
        await this.#fwrite(this.#question_path,val);
        
        await this.#notice(this.#answer_path,true);
        //be noticed this answer is prepared
        
        return await this.#fread(this.#answer_path);
      },
      () =>  this.#fdelete(this.#answer_path)
             //notice answer has been read
             
    );
  }


/*
  The peer side of ask.
  Wait until the previous answer has been read,
  let write_ans write the answer to the previous question,
  wait for the next question, read it.
  The question is always deleted afterwards, also if a step failed.
  After such an abnormal read the peer must still write an answer
  (e.g. the error), otherwise the asker waits forever.
  Resolves with the question.

  write_ans(writer) => Promise
    call await writer(ans) to write the answer; ans may be a Promise.
    The default does nothing, for the first call, which has nothing to answer.

  Concurrent calls are serialized.
  Waits indefinitely; there is no time-out.
  If that delete fails, later calls to answer reject.
*/
  /*reference*/ async answer(
    write_ans = async (writer) => {}
  ){
    
    return await this.#sync_answer.sync(
      async () => {
        await this.#notice(this.#answer_path, false);
        //be noticed old answer has been read

        await write_ans(
          async (ans) => this.#fwrite(
            this.#answer_path,
            await ans //answer Q0
          )
        );
        
        await this.#notice(this.#question_path,true);
        //be noticed new question is prepared
        
        return this.#fread(this.#question_path); //ask Q0
         
      },
      () =>  this.#fdelete(this.#question_path)
             //notice question has been read
             
    );
  }

  async #notice(path,is_exist){
    await this.#sync.wait_for(
      async () => (await this.#fexist(path)) === is_exist
    );
  }
  
}
