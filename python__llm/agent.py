# framework by me, cowork with claude, Gemini and DeepSeek
from __future__ import annotations
from abc import ABC, abstractmethod

#implement INTERFACE in sandbox
class Agent(ABC):
    def __init__(
        self,
        todo:str = "",
        reference:str = "",
        definition:str = "",
        expr:str = "",
        require:str = "",
    ):
         self.todo = todo
         self.log = ""
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
        the kind of value a string literal like {self.string_literal("content")}
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
LOG
    empty if your previous reply was accepted,
    otherwise why it was rejected as a whole,
    nothing of it was applied and the other fields are unchanged
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
    depends on INTERFACE, PACKAGE, REQUIRE, REFERENCE and DEFINITION,
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
    depends on INTERFACE, PACKAGE, REQUIRE, REFERENCE and DEFINITION,
    empty means nothing calculated,
    this field will be empty if before EXPR successful,
    otherwise error message attached on the top of before EXPR
------
HOW TO OUTPUT
    reply with one json object and nothing else,
    no markdown fence, no text before or after it
    these fields are required, every value a json string literal:
        TODO
        REFERENCE
        DEFINITION
        EXPR
        REQUIRE
    hint:
        empty field is ""
        put code inside the string values, write each line break as \\n
        escape quotes and backslashes as json string literal requires
HOW TO FIX BUG
    a LOG that is not empty
    means your previous reply was rejected as a whole:
         fix the json and reply again
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
              "LOG": self.log,
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
        
        try:
           agent = self.think(prompt)
           self.log = ""
        except Exception as e:
            self.log = self.summary_error(e)
            return None
           
        
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
               self.exec_expr(agent.expr)
               self.expr = ""
           except Exception as e:
               self.expr = self.assemble_error(e,agent.expr)
        
        self.result = self.latest_result()
        
        if agent.require == "" and agent.definition == "" and agent.expr == "":
          self.finish(self.result)
        else:
          self.todo = agent.todo
          self.reference = agent.reference

    #------abstract method------
    
    #return a new Agent
    #raise
    #  if the reply cannot be accepted,
    #  see more at self.system
    @abstractmethod
    def think(self, json_prompt) -> Agent:
      ...
    
    #def func safely (in sandbox)
    @abstractmethod
    def def_func(self, definition: str) -> None:
      ...

    #exec expr safely (in sandbox)
    @abstractmethod
    def exec_expr(self, expr: str) -> None:
      ...
    
    #return
    #  str
    #     the string returned by the latest successful self.func_call_code(["value","v","f"])
    #  None
    #     if none has succeeded yet
    @abstractmethod
    def latest_result(self) -> str | None:
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

    #programming language name
    @abstractmethod
    def lang(self) -> str:
      ...
    
    #summary error as comment of self.lang()
    @abstractmethod
    def summary_error(self,e: Exception) -> str:
      ...

    #assemble func call form for self.lang()
    #lisp [f,a,b,...] is (f a b ...) in lisp
    @abstractmethod
    def func_call_code(self, lisp:list[str]) -> str:
      ...
    
    #assemble list form for self.lang()
    #lisp [a,b,...] is '(a b ...) in lisp
    @abstractmethod
    def list_code(self, lisp:list[str]) -> str:
      ...

    #assemble string literal for self.lang()
    #lisp "foo" is "foo" in lisp
    @abstractmethod
    def string_literal(self, lisp: str) -> str:
      ...

    
   
    
    
