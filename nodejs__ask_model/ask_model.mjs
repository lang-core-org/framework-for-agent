/*framework by me, cowork with Claude,Gemini*/

import { setTimeout } from "node:timers/promises";

export class ask_model {

  static #answer = 0;

  static #answered = null;
  static #no_question = undefined;

  static #ask = ask_model.#no_question;
  static #ans = null;

  static #has_question(){
    return typeof(ask_model.#ask) === "string";
  }

  /*
    Submit a question and await the corresponding answer.
    Processes one question at a time; subsequent calls block 
    until the current transaction completes.

    `Q` The input payload (serialized using JSON.stringify).
    Returns a Promise that fulfills with the model's answer.
  */
  static async ask(Q){
    let q = JSON.stringify(Q);
    await ask_model.#wait_for(
      () => ask_model.#ask === ask_model.#no_question
    );
    ask_model.#ask = q;
    await ask_model.#wait_for(
      () => ask_model.#ask === ask_model.#answered
    );
    let ans = ask_model.#ans;
    ask_model.#ask = ask_model.#no_question;
    return ans;
  }

   /*
    Yield and process pending questions sequentially.
    Only one answerer instance may be active concurrently.

    Returns an async generator:
      next() yields the first pending serialized question.
      next(answer) completes the current question with `answer`,
        then yields the next pending question.
    Throws a RangeError if an answerer is already running.
  */
  static async *ans(){
    if(ask_model.#answer === 0){
      ask_model.#answer = 1;
      for(;;){
        await ask_model.#wait_for(
          () => ask_model.#has_question()
        );
        ask_model.#ans = yield ask_model.#ask;
        ask_model.#ask = ask_model.#answered;
      }
    }else{
      throw RangeError("ask_model.ans is only allowed one answer");
    }
  }

  static async #wait_for(fcond){
    while(fcond() === false){
      await setTimeout(0, undefined, { ref: false });
    }
  }

}
