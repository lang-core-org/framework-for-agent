# framework by me, cowork with claude and Gemini
from __future__ import annotations
from abc import ABC, abstractmethod
class Agent(ABC):
    def __init__(
        self,
        todo:str,
        package:list[str],
        reference:str,
        definition:str,
        before:str,
        expr:str,
        require:str,
    ):
         self.todo = todo
         self.package = package
         self.reference = reference
         self.definition = definition
         self.before = before
         self.expr = expr
         self.require = require

         self.system = \
f"""
SYSTEM
    this manual for you
TODO
    what todo next,
    mange by you
PACKAGE
    a list for package what you require successfully
    in REQUIRE before
REFERENCE
    reference for all function you wrote,
    mange by you
DEFINITION
    using {self.lang()} to wrote singleton func
    depends on REFERENCE, PACKAGE
    and this time DEFINITION,
    then edit REFERENCE for reference,
    empty means no definition,
    this field will be empty if before DEFINITION successful,
    otherwise error message attached on the top of before DEFINITION
BEFORE
    value of before expr,
    this field will be empty if before EXPR failed
EXPR
    using {self.lang()} to wrote singleton expr
    depends on REFERENCE, PACKAGE
    and this time DEFINITION,
    value of expr should be json str,
    empty means nothing calculated,
    this field will be empty if before EXPR successful,
    otherwise error message attached on the top of before EXPR
REQUIRE
    a package for {self.lang()} you need to import,
    FORBIDDEN import in DEFINTION or EXPR,
    empty means nothing required,
    this field will be empty if before REQUIRE successful,
    otherwise error message attached on the top of before REQUIRE
------
HOW TO OUTPUT
    a json has same struct of this whole json
HOW TO FINISH
    empty EXPR and empty REQUIRE
"""

    def assemble_prompt(self):
        prompt = {
              "SYSTEM": self.system,
              "TODO": self.todo,
              "PACKAGE": self.package,
              "REFERENCE": self.reference,
              "DEFINITION": self.definition,
              "BEFORE": self.before,
              "EXPR": self.expr,
              "REQUIRE": self.require
        }
        return prompt
    
    def assemble_error(self,e,src):
        return f"{self.summary_error(e)}\n{src}"

    def step(self):
        prompt = self.assemble_prompt()
        agent = self.think(prompt)
        
        if agent.definition == "":
           pass
        else:
           try:
               self.def_func(agent.definition)
               self.definition = ""
           except Exception as e:
               self.definition = self.assemble_error(e,agent.definition)
        
        if agent.expr == "":
           pass
        else:
           try:
               self.before = self.exec_expr(agent.expr)
               self.expr = ""
           except Exception as e:
               self.before = ""
               self.expr = self.assemble_error(e,agent.expr)

        if agent.require == "":
           pass
        else:
            try:
                self.import_package(agent.require)
                self.package.append(agent.require)
                self.require = ""
            except Exception as e:
                self.require = self.assemble_error(e,agent.require)
           

        if agent.expr == "" and agent.require == "":
          self.finish(self.before)
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
    @abstractmethod
    def exec_expr(self, expr: str) -> str:
      ...

    #import package safely (in sandbox)
    #suggest ask human first
    @abstractmethod
    def import_package(self, package: str) -> bool:
      ...

    #finish this workflow (don't forget clear)
    @abstractmethod
    def finish(self,last_result: str) -> None:
      ...

    #programm language name
    @abstractmethod
    def lang(self) -> str:
      ...
    #summary error as comment of self.lang()
    @abstractmethod
    def summary_error(self,e: Exception) -> str:
      ...
    
    
