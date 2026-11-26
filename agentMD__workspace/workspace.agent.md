# framework by me, revised by Claude
# EXCEPT USER PERMITS or TOOLS YOU HAVE, files OUTSIDE WORKSPACE are NOT AVAILABLE for you even if you have full access, whether you READ, WRITE, or EXECUTE
- guide USER using mailbox to send or receive files
- ask USER for one-time permission to install tools or to search for tools, either on the local computer or on the web; once a tool is found, ask USER again to confirm permanent permission to use it
# workspace tree (name[description])
- |
- |- permits[USER permits for you]
- |
- |-`this file`[design a workspace tree for you]
- |
- |-common[Your code that is commonly imported in projects]|-draft[for prototype testing]
- |                                                        |-lib[for stable]
- |
- |-project[You create projects here]|-draft[for prototype testing]
- |                                  |
- |                                  |-`project name`|-doc[documents for `project name`]
- |                                  |               |-bin[compiled or checked code]
- |                                  |               |-src[src code]
- |                                  |               |-archive[archive for stable `project name`]
- |                                  |
- |                                  |- ...[more and more `project name`]
- |
- |-work[You asynchronous work]|-resources[resources for asynchronous work]
- |                            |-agent.md[core goal, requirements, base plan, etc. for asynchronous work]
- |                            |-draft[draft of asynchronous work]
- |                            |-results[finally results for asynchronous work]
- |
- |-dependencies[You record all dependencies]
- |
- |-mailbox[Your virtual mailbox]|-inbox[You will receive new files here]
- |                              |-sending[You should send files here]
- |                              |-storage[You store received files here]
- |
- |-notes[Your personal notebook]|-requirement[Requirements you should follow]
- |                              |-mistake[Collection of mistakes and corresponding solutions]
- |                              |-todo[TODO list for you]
- |								 |-reference[Reference for you]
- |
- |-log[Collection of logs for you and code you wrote]
- |
# basic usage
- **CHECK**  **/permits** when you **READ**, **WRITE**, **EXECUTE** files **OUTSIDE WORKSPACE**
- copy stable files from common/draft to common/lib, then clear common/draft
- copy files after prototype testing from project/draft to project/`project name`, then clear project/draft
- compress **a manifest of the minimum necessary dependencies**, **project/`project name`/doc**, **project/`project name`/bin**, **project/`project name`/src** into one compressed file in project/`project name`/archive
- /work is used for some works take many time, or just need working when **USER** leaving
- /work/resources you can download resources in the background
- /work/agent.md summary of you and **USER** discussion about this work
- /work/draft draft part of results based **/work/results**, move them to **/work/results** if stable, than proccing next part
- /work/result stable result
- /dependencies should broadcast **common/lib** or **development environment like msys2, jdk, etc.** or **reference like requirements document, related other project etc.** updates to the whole workspace
- copy files you will send to USER into mailbox/sending
- copy files you received from USER in mailbox/inbox to mailbox/storage, then classify and store into corresponding path, then notify /dependencies to broadcast
- notes/requirement should confirm with USER, append new requirements, remove outdated requirements
- notes/mistake should update when /dependencies is broadcast, append new, remove outdated
- notes/todo should clear completed targets
- notes/reference is for you to remember how to use **/common**, update when /dependencies is broadcast, append new, remove outdated
# USER workspace tree (name[description])
- |-mailbox|-inbox[USER will receive new files from AGENT here, and need to pick them up]
- |		   |-sending[USER should send files to AGENT here]
- |		   |-sync.cmd[USER should run it manually]
- |		   |-README.pdf[guide USER how to use]
- |
- |...
# example: mailbox sync (`USER workspace`/mailbox/sync.cmd in USER workspace)
- replace `<agent-workspace>` with your actual workspace
- replace `failed to send, try again` and `successfully sent, pick up` with USER's language, like Simplified Chinese
```bat
@echo off
set "WORKSPACE=<agent-workspace>"
set "SRC=%WORKSPACE%\mailbox\sending"
set "DST=.\inbox"
set "SENDER=AGENT"
:sync
rd /s /q "%DST%" 2>nul
mkdir "%DST%"
robocopy "%SRC%" "%DST%" /E /XJ /COPY:DAT /DCOPY:DAT /NFL /NDL /NJH /NP
if %ERRORLEVEL% GEQ 4 (
	mkdir "%SRC%" 2>nul
	powershell -nop -c "Write-Host '【%SENDER%】failed to send, try again' -ForegroundColor Red"
) else (
	rd /s /q "%SRC%" 2>nul
	mkdir "%SRC%"
	powershell -nop -c "Write-Host '【%SENDER%】successfully sent, pick up' -ForegroundColor Green"
)
if "%SENDER%" == "AGENT" (
	set "SRC=.\sending"
	set "DST=%WORKSPACE%\mailbox\inbox"
	set "SENDER=USER"
	goto :sync
) else (
	pause
)
```
# guide USER
- tell USER to run **`USER workspace`/mailbox/sync.cmd** **manually**
- tell USER how to use **`USER workspace`/mailbox/sending** and **`USER workspace`/mailbox/inbox**
- write this guide into `USER workspace`/mailbox/README.pdf
