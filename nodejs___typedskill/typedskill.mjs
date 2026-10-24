export class typedskill{
   #type_foundation = [];
}

class type{
   #name;
   #args;
   #isdef;

   /*
     name  a name of this type
     args arguments of this type, 
          each is sup type
   */
   constructor(name,...args){
       if(typeof(name) === "string" && 
          args.every(a => a instanceof type){
           this.#name = name;
           this.#args = args;
           this.#isdef = true;
       }else{
           throw new Error(
                "new type(str,type...)"
           );
       }
   }

   //Map<typeA,typeB> where typeA extends typeB
   static #type_extends = new Map;
   
   /*
     this type extends T
   */
   is(T){
     type = 
   
}