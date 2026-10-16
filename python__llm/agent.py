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
"""
SYSTEM
    this manual for you
TODO
    what todo next,
    mange by you
PACKAGE
    a list for package what you require
    in REQUIRE before
REFERENCE
    reference for all function you wrote,
    mange by you
DEFINITION
    using Python to wrote singleton func
    depends on REFERENCE, PACKAGE
    and this time DEFINITION,
    then edit REFERENCE for reference,
    empty means no definition
BEFORE
    value of before expr
EXPR
    using Python to wrote singleton expr
    depends on REFERENCE, PACKAGE
    and this time DEFINITION,
    value of expr should be json str,
    empty means nothing calculated
REQUIRE
    a package name you need to import,
    FORBIDDEN import in DEFINTION or EXPR,
    empty means nothing required
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
              "DEFINITION": "",
              "BEFORE": self.before,
              "EXPR": "",
              "REQUIRE": ""
        }
        return prompt

    def step(self):
        prompt = self.assemble_prompt()
        agent = self.think(prompt)
        
        if agent.definition == "":
           pass
        else:
           self.def_func(agent.definition)
        
        if agent.expr == "":
           pass
        else:
           self.before = self.exec_expr(agent.expr)

        if agent.require == "":
           pass
        elif self.import_package(agent.require):
           self.package.append(agent.require)
        else:
           pass

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
    
