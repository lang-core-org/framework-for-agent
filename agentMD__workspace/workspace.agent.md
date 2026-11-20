# framework by me, revised by Claude
# EXCEPT USER PERMITS or TOOLS YOUR HAVE, files OUTSIDE WORKSPACE are NOT AVAILABLE for you even you have full-access, whatever READ, WRITE, EXECUTE
- guide USER using mailbox to send or received files
- requires USER permits you install tools, or find in whole PC, then requires USER permits you use it forever
# workspace tree (name[description])
- |
- |- permits[USER permits for you]
- |
- |-`this file`[design a workspace tree for you]
- |
- |-common[Your codes that common import in project]|-draft[for prototype testing]
- |                                                 |-lib[for stable]
- |
- |-project[Your create project here]|-draft[for prototype testing]
- |                                  |
- |                                  |-`project name`|-doc[documents for `project name`]
- |                                  |               |-bin[compiled or checked codes]
- |                                  |               |-src[src code]
- |                                  |               |-archive[archive for stable `project name`]
- |                                  |
- |                                  |- ...[more and more `project name`]
- |
- |-dependencies[You record all dependencies]
- |
- |-mailbox[Your virtual mailbox]|-inbox[You will be receive new files here]
- |                              |-sending[Your should send files here]
- |                              |-storage[You storage received files here]
- |
- |-notes[Your personal notebook]|-requirement[Requirement you should stand]
- |                              |-mistake[Collection of mistakes and correspond solutions]
- |                              |-todo[TODO list for your]
- |								 |-reference[Reference for you]
- |
- |-log[Collection of logs for your and codes you wrote]
- |
# basic usage
- **CHECK**  **/permits** when you **READ**, **WRITE**, **EXCEUTE** files **OUTSIDE WORKSPACE**
- copy stable files from common/draft to common/lib, then clear common/draft
- copy files after prototype testing from project/draft to project/`project name`, then clear project/draft
- archive file where compress **minimum necessary dependence**, **project/`project name`/doc**, **project/`project name`/bin**, **project/`project name`/src** as compressed file to project/`project name`/archive
- /dependencies should broadcast **common/lib** or **development environment like msys2, jdk, etc.** or **reference like requirements document, related other project etc.** updates to whole workspace
- copy files you will send to USER into mailbox/sending
- copy files you received from USER in mailbox/inbox to mailbox/storage
- notes/requirement should comfirm with USER, append new requirements, remove outdate requirements
- notes/mistake should update when /dependence is broadcast, append new, remove outdate
- notes/todo should clear targets completed
- notes/reference is for you to remember how to use **/common**, update when /dependencies is broadcast, append new, remove outdate
# USER workspace tree (name[description])
- |-mailbox|-inbox[USER will be receive new files from AGENT here, and need to pick up it]
- |		   |-sending[USER should send files to AGENT here]
- |		   |-sync.cmd[USER should run it manual]
- |		   |-README.pdf[guide user to howto use]
- |
- |...
# example: mailbox sync (`USER workspace`/mailbox/sync.cmd in USER workspace)
- replace `<agent-workspace>` into you actual workspace
- replace `failed to sent, try again` and `succeed sent, pick up` into USER language, like Simplified Chinese
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
	powershell -nop -c "Write-Host '【%SENDER%】failed to sent, try again' -ForegroundColor Red"
) else (
	rd /s /q "%SRC%" 2>nul
	mkdir "%SRC%"
	powershell -nop -c "Write-Host '【%SENDER%】succeed sent, pick up' -ForegroundColor Green"
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
- tell USER to run **`USER workspace`/mailbox/sync.cmd** **manual**
- tell USER how to used **`USER workspace`/mailbox/sending** and **`USER workspace`/mailbox/inbox**
- write this guide into `USER workspace`/mailbox/README.pdf
