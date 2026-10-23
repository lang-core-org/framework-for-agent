/*framework by me, cowork with Claude, Gemini, DeepSeek, DSH*/

import { Synchronized } from "../nodejs__synchronized/Synchronized.mjs";

export class ask_model {

  #fread;
  #fwrite;
  #fexist;
  #fdelete;
  #question_path;
  #answer_path;
  #wait;
  #sync_ask;
  #sync_ans;
  #answered = true; //whether ans successful
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
    this.#wait = wait;
    this.#sync_ask = Synchronized.sync(
      ask_model.#ask_func,
      () => ask_model.#ask_reset(this)
    );
    this.#sync_ans = Synchronized.sync(
      ask_model.#ans_func,
      () => ask_model.#ans_reset(this)
    );
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
    return this.#sync_ask(this,val);
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
  /*reference*/ async ans(fmodel){
    return this.#sync_ans(this,fmodel);
  }

  async #notice(path,is_exist){
    await Synchronized.wait_for(
      this.#wait,
      async () => (await this.#fexist(path)) === is_exist
    );
  }

  static async #ask_reset(self){
    await self.#notice(self.#question_path,false);
    await self.#fdelete(self.#answer_path);
  }

  static async #ask_func(self,val){
    let question = await val;
    await self.#fwrite(self.#question_path,question);
    await self.#notice(self.#answer_path,true);
    return await self.#fread(self.#answer_path);
  }

  static async #ans_reset(self){
    if(self.#answered === true){
      await self.#fdelete(self.#question_path);
      self.#answered = false;
    }else{
      //passing
    }
    
  }

  static async #ans_func(self, fmodel){
    await self.#notice(self.#question_path,true);
    let question = await self.#fread(self.#question_path);
    let answer = await fmodel(question);
    await self.#fwrite(self.#answer_path,answer);
    self.#answered = true;
  }
  
}
