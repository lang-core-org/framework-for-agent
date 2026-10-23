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
    and delete the question after answering it.

  Protocol (the existence of a file is the notification), in sequence:
    question written : we have asked
    answer written   : the peer has answered
    question deleted : the peer has answered it
    answer deleted   : we have read

  question_path, answer_path: files shared with the peer, both exist at the start
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
  Wait until the peer has deleted the previous question,
  delete the previous answer,
  write val as the question, wait for the answer, read it.
  val may be a Promise.
  The answer file stays until the next call deletes it.
  Concurrent calls are serialized.
  Waits indefinitely; there is no time-out.
*/
  async ask(val){
    return this.#sync_ask(this,val);
  }


/*
/*
  The peer side of ask.
  Delete the previous question if it was answered,
  wait for a question, read it,
  write the result of fmodel(question) as the answer.
  Resolves once the answer is written.

  fmodel(question) => answer | Promise<answer>

  If any step fails, ans rejects and the question stays,
  so the next call answers it again.
  Concurrent calls are serialized.
  Waits indefinitely; there is no time-out.
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
