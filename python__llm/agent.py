# framework by me, cowork with claude, Gemini and DeepSeek
from __future__ import annotations
from abc import ABC, abstractmethod

#implement INTERFACE in sandbox
class Agent(ABC):
    def __init__(
        self,
        todo:str,
        reference:str,
        definition:str,
        expr:str,
        require:str,
    ):
         self.todo = todo
         self.package = []
         self.reference = reference
         self.definition = definition
         self.result = None
         self.expr = expr
         self.require = require

         self.system = \
f"""
SYSTEM
    this manual for you
INTERFACE
    functions already defined in the runtime, usable in DEFINITION and EXPR,
    never define or redefine them
    {self.func_call_code(["result"])}
        if some {self.func_call_code(["value","v","f"])} has succeeded
           return {self.list_code(["v"])}, v of the latest success
        otherwise
           return {self.list_code([])}
    {self.func_call_code(["value","v","f"])}
        v any value
        f a function, {self.func_call_code(["f","v"])} must return a string,
        which corresponding string literal,
        e.g. {self.string_literal("content")}
        if {self.func_call_code(["f","v"])} succeeds and returns a string
            remember v, return that string
        otherwise
            throw an error, nothing is remembered
    {self.func_call_code(["ask","question"])}
        question any string
        ask the human and wait, return the answer as a string  
TODO
    what todo next,
    manage by you
PACKAGE
    a list for package what you require successfully
    in REQUIRE before
REQUIRE
    a package for {self.lang()} you need to import,
    FORBIDDEN import in DEFINITION or EXPR,
    empty means nothing required,
    this field will be empty if before REQUIRE successful,
    otherwise error message attached on the top of before REQUIRE
REFERENCE
    reference for all function you wrote,
    manage by you
DEFINITION
    using {self.lang()} to write singleton func
    depends on INTERFACE, PACKAGE, REQUIRE, REFERENCE and DEFINITION
    and this time DEFINITION,
    then edit REFERENCE for reference,
    empty means no definition,
    this field will be empty if before DEFINITION successful,
    otherwise error message attached on the top of before DEFINITION
RESULT
    the string returned by the latest successful {self.func_call_code(["value","v","f"])},
    kept across steps,
    JSON null if there is none yet
EXPR
    using {self.lang()} to write singleton expr
    depends on INTERFACE, PACKAGE, REQUIRE, REFERENCE and DEFINITION
    and this time DEFINITION,
    empty means nothing calculated,
    this field will be empty if before EXPR successful,
    otherwise error message attached on the top of before EXPR
------
HOW TO OUTPUT
    a json include field
        TODO: string
        REFERENCE: string
        DEFINITION: string
        EXPR: string
        REQUIRE: string
HOW TO FIX BUG
    a REQUIRE, DEFINITION or EXPR that starts with an error comment
    means its previous attempt failed:
    the comment is the error, the code below it is what failed
    output the corrected code only, without the error comment
    (the system attaches it, it is not part of the code)
    for REQUIRE, output the corrected package name only
    do not repeat the same content
HOW TO FINISH
    empty DEFINITION and empty EXPR and empty REQUIRE
"""

    def assemble_prompt(self):
        prompt = {
              "SYSTEM": self.system,
              "TODO": self.todo,
              "PACKAGE": self.package,
              "REQUIRE": self.require,
              "REFERENCE": self.reference,
              "DEFINITION": self.definition,
              "RESULT": self.result,
              "EXPR": self.expr
        }
        return prompt
    
    def assemble_error(self,e,src):
        return f"{self.summary_error(e)}\n{src}"

    def step(self):
        prompt = self.assemble_prompt()
        agent = self.think(prompt)
        
        if agent.require == "":
           self.require = ""
        else:
            try:
                self.import_package(agent.require)
                self.package.append(agent.require)
                self.require = ""
            except Exception as e:
                self.require = self.assemble_error(e,agent.require)
           
        if agent.definition == "":
           self.definition = ""
        else:
           try:
               self.def_func(agent.definition)
               self.definition = ""
           except Exception as e:
               self.definition = self.assemble_error(e,agent.definition)
        
        if agent.expr == "":
           self.expr = ""
        else:
           try:
               self.result = self.exec_expr(agent.expr)
               self.expr = ""
           except Exception as e:
               self.expr = self.assemble_error(e,agent.expr)
        

        if agent.require == "" and agent.definition == "" and agent.expr == "":
          self.finish(self.result)
        else:
          self.todo = agent.todo
          self.reference = agent.reference

    #------abstract method------
    
    #return a new Agent
    @abstractmethod
    def think(self, json_prompt) -> Agent:
      ...
    
    #def func safely (in sandbox)
    @abstractmethod
    def def_func(self, definition: str) -> None:
      ...

    #exec expr safely (in sandbox)
    #return
    #  result 
    #     if exist lastest result of self.func_call_code(["value","v","f"])
    #  None
    #     otherwise
    @abstractmethod
    def exec_expr(self, expr: str) -> str | None:
      ...

    #import package safely (in sandbox)
    #suggest ask human first
    @abstractmethod
    def import_package(self, package: str) -> None:
      ...

    #finish this workflow (don't forget clear)
    @abstractmethod
    def finish(self,last_result: str | None) -> None:
      ...

    #programm language name
    @abstractmethod
    def lang(self) -> str:
      ...
    
    #summary error as comment of self.lang()
    @abstractmethod
    def summary_error(self,e: Exception) -> str:
      ...

    #assembe func call form for self.lang()
    #lisp [f,a,b,...] is (f a b ...) in lisp
    @abstractmethod
    def func_call_code(self, lisp:list[str]) -> str:
      ...
    
    #assembe list form for self.lang()
    #lisp [a,b,...] is '(a b ...) in lisp
    @abstractmethod
    def list_code(self, lisp:list[str]) -> str:
      ...

    #assembe string literal for self.lang()
    #lisp foo is "foo" in lisp
    @abstractmethod
    def string_literal(self, lisp: str) -> str:
      ...

    
   
    
    
