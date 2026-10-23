/*
This is a guess Number game for model
This file is not framework, so no document
Ported from https://umap.page/Guess%20Number.html by Claude
*/
import { randomInt } from "node:crypto";
import { ask_model } from "../nodejs__ask_model__synchronized/ask_model.mjs";

export class guessN{
  static #min = -1000;
  static #max = 1000;
  static #rel = ["less than","equal to","greater than"];
  static #rw = ["right","wrong"];
  static #err = [
    "What you input is not number!",
    "Are you kidding?",
    "Do you know that we are playing a game named \"Guess Number\" ?",
    "…"
  ];
  static #believe = [
    "I believe!",
    "Yes!",
    "Hopeful you're honest!",
    "I choose believe because I hope that I could get the answer soon!"
  ];
  static #dont_believe = [
    "I don't believe!",
    "No!",
    "Are you kidding me?",
    "I choose don't believe because I hope that I could get the answer soon!"
  ];
  #N;
  #model;
  #opt;
  #succeed;
  #peek;
  #claim;
  #log;

  constructor(askmodel_instance){
    if(askmodel_instance instanceof ask_model === false){
      throw new TypeError("askmodel_instance must be an ask_model");
    }
    this.#N = guessN.#R();
    this.#model = askmodel_instance;
    this.#opt = new Map();
    this.#succeed = false;
    this.#peek = false;
    this.#claim = null;
    this.#log = ["[Me] Let's guess number!"];
  }

  async main(){
    let turns = 0;
    while(this.#succeed === false){
      this.#opt = this.#options();
      let reply = await this.#model.ask(this.#question());
      this.#step(String(reply));
      turns = turns + 1;
    }
    await this.#model.ask(
      `${this.#log.at(-1)}\nYou win after ${turns} turns! Reply ok.`
    );
    return turns;
  }

  static #R(){
    return randomInt(
      guessN.#min,
      guessN.#max
    );
  }

  static #on(C,act){
    return (c,n) => {
      if(c !== C){
        return false;
      }else{
        act(n);
        return true;
      }
    };
  }

  static #auto_select(c,maps){
    let keys = [...maps.keys()];
    for(let i = keys.length - 1; i > 0; i = i - 1){
      let j = randomInt(0,i + 1);
      [keys[i],keys[j]] = [keys[j],keys[i]];
    }

    return new Map(
      keys.slice(0,c).map(
        (e,index) => {
          let C = String.fromCharCode(65 + index);
          return [`<typed ${C}> ${e}`,maps.get(e)(C)];
        }
      )
    );
  }

  #options(){
    let maps = new Map();
    maps.set(
      "Guess the number (add your integer after the letter)",
      (C) => guessN.#on(C,(n) => this.#guess(n))
    );
    if(this.#peek === true){
      maps.set(
        "Peek at the answer!",
        (C) => guessN.#on(C,() => this.#cheat())
      );
    }
    if(this.#claim !== null){
      let claim = this.#claim;
      maps.set(
        guessN.#believe[claim.bi],
        (C) => guessN.#on(C,() => this.#judge(claim,true))
      );
      maps.set(
        guessN.#dont_believe[claim.di],
        (C) => guessN.#on(C,() => this.#judge(claim,false))
      );
    }
    return guessN.#auto_select(maps.size,maps);
  }

  #question(){
    return [
      `Guess Number! The answer is an integer between ${guessN.#min} and ${guessN.#max - 1}, but don't expect to guess it!`,
      "",
      ...this.#log.slice(-12),
      "",
      "Options:",
      ...this.#opt.keys(),
      "",
      "Reply with the letter of one option; the guess option also needs an integer, like \"C 42\"."
    ].join("\n");
  }

  #step(reply){
    let m = /^\s*([A-Za-z])\s*(-?\d+)?\s*$/.exec(reply);
    let c = (m === null) ? null : m[1].toUpperCase();
    let n = (m === null || m[2] === undefined) ? undefined : Number(m[2]);
    let done = [...this.#opt.values()].some((h) => h(c,n));
    if(done === false){
      this.#say(reply.trim().slice(0,20),"That is not one of the options!");
    }
  }

  #say(you,me){
    this.#log.push(`[You] ${you}`,`[Me] ${me}`);
  }

  #change_N(){
    let n = this.#N;
    while(n === this.#N){
      n = guessN.#R();
    }
    this.#N = n;
  }

  #turn(show,you,me,fact,can_end){
    if(show === 0){
      this.#change_N();
    }
    this.#claim = null;
    if(show === 2){
      this.#claim = {
        fact: fact,
        can_end: can_end,
        bi: randomInt(0,4),
        di: randomInt(0,4)
      };
    }
    this.#say(you,me);
  }

  #guess(n){
    if(n === undefined){
      this.#say("Guess without a number",guessN.#err[randomInt(0,4)]);
      return;
    }
    let fact = Math.sign(n - this.#N) + 1;
    let fake = randomInt(0,3);
    let show = randomInt(0,4);
    let me = [
      "What makes it more fun is that I have changed the answer!",
      `Aha! The input is ${guessN.#rel[fact]} the answer!`,
      `Would you believe it if I tell you that the input is ${guessN.#rel[fake]} the answer?`,
      "I couldn't tell you whether you guess the number!"
    ][show];
    this.#turn(show,`Guess ${n}`,me,fact === fake,fact === 1);
    if(show === 1 && fact === 1){
      this.#succeed = true;
    }
  }

  #cheat(){
    let fake = guessN.#R();
    let same = (fake === this.#N);
    let show = randomInt(0,4);
    let me = [
      `You have peeked the answer is ${this.#N}, but I changed answer!`,
      `You have peeked the answer is ${this.#N}!`,
      `Would you believe it if I tell you that the answer is ${fake}?`,
      "Don't peek the answer!"
    ][show];
    this.#turn(show,"Peek at the answer!",me,same,same);
    this.#peek = (show !== 3);
  }

  #judge(claim,trust){
    let you = trust ? guessN.#believe[claim.bi] : guessN.#dont_believe[claim.di];
    if(trust === true){
      if(claim.bi === 3){
        this.#peek = true;
      }
    }else{
      this.#peek = (claim.di === 3);
    }
    let right = (claim.fact === trust);
    let fact = right ? 0 : 1;
    let fake = randomInt(0,2);
    let show = randomInt(0,4);
    let me = [
      `You're ${guessN.#rw[fact]}, but answer has changed!`,
      `You're ${guessN.#rw[fact]}!`,
      `Would you believe that you're ${guessN.#rw[fake]}?`,
      "Did you think I would tell you?"
    ][show];
    this.#turn(show,you,me,fact === fake,claim.can_end);
    if(show === 1 && right && claim.can_end){
      this.#succeed = true;
    }
  }

}
