# Step by step how to stup my DevEnv 

## Software to install
- VScode 
    - Python 
    - Pylance
    - Jupyter
    - diff
    - Theme : Sublime Material Theme
    - json crack
    - Comment Anchor
    - spacetime
    - Anchor comment
    - rainbow indent
    - git graph
    - Data Wrangler
    - ...
- Obsidian 
- Git + Github settings to use ssh key
- Font Powershell and terminals 
    - Hack font 
- Cygwin, MSYS or else for C/C++ compilor and debug 
- Keepass for passwords management 
- Python 
- ChatGPT and Claude : AI 

## VScode settings to change 
- Save delay to ``afterdelay`` delay time ``1ms``
- Zoom ``-2``
- Edit the ruler for a width of ``80`` and a color ``red``
    - Open user ``settings.json``
    Add: 
    ```json
    "editor.rulers": [{
        "column": 80,
        "color": "red"
    }]
    ``` 

## Install terminal font 
1. Enable script execution on a powersehll terminal 
    - Check terminal execution policy 
    ```powershll 
    Get-ExecutionPolicy
    ```
    - If it's set to ``restricted`` do :
    ```powershll 
    Set-ExecutionPolicy Unrestricted -scope curentuser
    ```
2. Install ``Oh-My-Posh``
    - Do a manual installation using: 
    ```powershell 
    Set-ExecutionPolicy Bypass -Scope Process -Force; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://ohmyposh.dev/install.ps1'))
    ```
3. Install ``Hack`` font and set powershell and VScode to use it 
    - Install ``HackNerdFontMono-Regular`` from the directory Fonts/Hack 
    or 
    - Using ``Oh-My-Posh`` in a terminal and choose (down arrow) ``Hack``
    ```powershell
    oh-my-posh font install
    ```
4. Run ``Oh-My-Posh`` at terminal opening 
    - Edit powershell profile file using for instance
    ```powershell 
    code $PROFILE 
    ```
    and past this: 
    ```powershell
    # One can add here any path to add to the system path
    $env:Path += ";C:\Users\toufi\AppData\Local\Programs\oh-my-posh\bin"
    # Invoke (from a disk) Oh-My-Posh at termianl openeing and set a theme
    oh-my-posh init pwsh --config 'C:\Users\toufi\AppData\Local\Programs\Oh-my-Posh\themes\amro.omp.json' | Invoke-Expression
    ```
5. Set the mono font in VScode and Powershell 
    - Past in user ``settings.json``
    ```json
    "editor.fontFamily": "Consolas, 'Courier New', monospace",
    "terminal.integrated.fontFamily": "Hack Nerd Font Mono",
    ```
    - Close and Restart VScode

## Git configuration 
1. Past the follwing in ``git config --global -e``
    ```powershell 
    # This is Git's per-user configuration file.
    [user]
        name = T.Saouchi
        email = toufik.saouchi@gmail.com
        
    [core]
        autocrlf = false
        eol = CRLF
        editor = \"C:\\Users\\toufi\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code\" --wait

    [merge]
        tool = code.cmd --wait

    [mergetool "code"]
        cmd = code.cmd --wait $MERGED

    [diff]
        tool = default-difftool
    [difftool "default-difftool"]
        cmd = code.cmd --wait --diff $LOCAL $REMOTE

    [alias]
        st = status
        ci = commit 
        a = add
        aa = add -A
        pushall = "!f() { for remote in $(git remote); do git push $remote --all && git push $remote --tags; done; }; f"
	    pushthis = "!f() { for remote in $(git remote); do git push $remote $(git branch --show-current); done; }; f"
    ```
