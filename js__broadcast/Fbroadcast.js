/*framework by me, cowork with GPT*/

/*broadcast event to all instance of Fbroadcast*/
class Fbroadcast{
  
  static #target = new Set();
  
  constructor(){
    //cannot create Fbroadcast itself
    Fbroadcast.add(this);
  }

  /*event proceed success or omit*/
  static done(){
    return Promise.reslove();
  }

  /*event proceed error*/
  static throws(error){
    if(error /*is Error*/){
      return Promise.reject(error);
    }else{
      return promise.reject(
        Error("ori type error")
      );
    }
  }

  static #broadcast(fname,params){
    
  }
  changedFile(path){
    return Fbroadcast.done();
  }
  
}
